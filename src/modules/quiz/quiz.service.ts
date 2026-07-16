import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateQuizDto, UpdateQuizDto, SubmitQuizDto } from './dto/quiz.dto';

@Injectable()
export class QuizService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
    ) { }

    // ── Admin: CRUD ───────────────────────────────────────────────────────────

    async adminCreate(dto: CreateQuizDto) {
        if (!dto.questions || dto.questions.length === 0) {
            throw new BadRequestException('Quiz must have at least one question');
        }
        return this.prisma.quiz.create({
            data: {
                title: dto.title,
                price: dto.price,
                timeLimit: dto.timeLimit ?? 2,
                isActive: dto.isActive ?? true,
                questions: {
                    create: dto.questions.map((q, i) => ({
                        question: q.question,
                        options: q.options,
                        correctIndex: q.correctIndex,
                        sortOrder: q.sortOrder ?? i,
                    })),
                },
            },
            include: { questions: { orderBy: { sortOrder: 'asc' } } },
        });
    }

    async adminFindAll() {
        return this.prisma.quiz.findMany({
            include: { _count: { select: { questions: true, purchases: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async adminFindOne(id: string) {
        const quiz = await this.prisma.quiz.findUnique({
            where: { id },
            include: { questions: { orderBy: { sortOrder: 'asc' } } },
        });
        if (!quiz) throw new NotFoundException('Quiz not found');
        return quiz;
    }

    async adminUpdate(id: string, dto: UpdateQuizDto) {
        const quiz = await this.prisma.quiz.findUnique({ where: { id } });
        if (!quiz) throw new NotFoundException('Quiz not found');
        return this.prisma.quiz.update({ where: { id }, data: dto });
    }

    async adminDelete(id: string) {
        const quiz = await this.prisma.quiz.findUnique({ where: { id } });
        if (!quiz) throw new NotFoundException('Quiz not found');
        await this.prisma.quiz.delete({ where: { id } });
        return { message: 'Quiz deleted' };
    }

    // ── User: browse & purchase ───────────────────────────────────────────────

    async findActive() {
        return this.prisma.quiz.findMany({
            where: { isActive: true },
            select: {
                id: true,
                title: true,
                price: true,
                timeLimit: true,
                _count: { select: { questions: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const quiz = await this.prisma.quiz.findUnique({
            where: { id, isActive: true },
            select: {
                id: true,
                title: true,
                price: true,
                timeLimit: true,
                questions: {
                    select: { id: true, question: true, options: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        if (!quiz) throw new NotFoundException('Quiz not found');
        return quiz;
    }

    async purchase(userId: string, quizId: string, paymentMethod: string) {
        const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId, isActive: true } });
        if (!quiz) throw new NotFoundException('Quiz not found');

        const existing = await this.prisma.quizPurchase.findFirst({
            where: { userId, quizId },
        });
        if (existing) throw new BadRequestException('You have already purchased this quiz');

        const price = Number(quiz.price);

        if (paymentMethod === 'WALLET') {
            const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
            if (!wallet) throw new NotFoundException('Wallet not found');
            if (Number(wallet.balance) < price) {
                throw new BadRequestException('Insufficient wallet balance');
            }

            return this.prisma.$transaction(async (tx: any) => {
                await this.walletService.debit(tx, wallet.id, price, 'QUIZ_PURCHASE', `Quiz purchase: ${quiz.title}`, quizId);

                const purchase = await tx.quizPurchase.create({
                    data: { userId, quizId, paymentMethod: 'WALLET' },
                });
                return purchase;
            });
        } else if (paymentMethod === 'BKASH') {
            return this.prisma.quizPurchase.create({
                data: { userId, quizId, paymentMethod: 'BKASH' },
            });
        } else {
            throw new BadRequestException('Invalid payment method');
        }
    }

    async getPurchased(userId: string) {
        return this.prisma.quizPurchase.findMany({
            where: { userId },
            include: {
                quiz: {
                    select: { id: true, title: true, price: true, timeLimit: true, _count: { select: { questions: true } } },
                },
            },
            orderBy: { purchasedAt: 'desc' },
        });
    }

    // ── Attempt ───────────────────────────────────────────────────────────────

    async startAttempt(userId: string, purchaseId: string) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: { quiz: { include: { questions: { orderBy: { sortOrder: 'asc' } } } } },
        });
        if (!purchase) throw new NotFoundException('Purchase not found');
        if (purchase.userId !== userId) throw new ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED') throw new BadRequestException('Quiz already completed or timed out');

        // Start timer on first access
        if (!purchase.startedAt) {
            await this.prisma.quizPurchase.update({
                where: { id: purchaseId },
                data: { startedAt: new Date() },
            });
        }

        // Return questions WITHOUT correctIndex
        const questions = purchase.quiz.questions.map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options as string[],
        }));

        return {
            purchase,
            quiz: { title: purchase.quiz.title, timeLimit: purchase.quiz.timeLimit },
            questions,
            startedAt: purchase.startedAt || new Date(),
        };
    }

    async submitAttempt(userId: string, purchaseId: string, dto: SubmitQuizDto) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: { quiz: { include: { questions: true } } },
        });
        if (!purchase) throw new NotFoundException('Purchase not found');
        if (purchase.userId !== userId) throw new ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED') throw new BadRequestException('Quiz already completed or timed out');

        // Check time limit
        const timeLimitMs = purchase.quiz.timeLimit * 60 * 1000;
        const startedAt = purchase.startedAt || new Date();
        const elapsed = Date.now() - startedAt.getTime();
        const timedOut = elapsed > timeLimitMs;

        // Grade
        const questions = purchase.quiz.questions;
        let score = 0;
        for (const answer of dto.answers) {
            const q = questions.find((qq) => qq.id === answer.questionId);
            if (q && q.correctIndex === answer.selectedIndex) {
                score++;
            }
        }

        const status = timedOut ? 'TIMEOUT' : 'COMPLETED';

        await this.prisma.quizPurchase.update({
            where: { id: purchaseId },
            data: {
                status,
                score,
                totalQuestions: questions.length,
                answers: dto.answers as any,
                completedAt: new Date(),
            },
        });

        return { status, score, totalQuestions: questions.length, timedOut };
    }
}
