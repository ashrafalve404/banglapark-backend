"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
let QuizService = class QuizService {
    prisma;
    walletService;
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
    }
    async adminCreate(dto) {
        if (!dto.questions || dto.questions.length === 0) {
            throw new common_1.BadRequestException('Quiz must have at least one question');
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
    async adminFindOne(id) {
        const quiz = await this.prisma.quiz.findUnique({
            where: { id },
            include: { questions: { orderBy: { sortOrder: 'asc' } } },
        });
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not found');
        return quiz;
    }
    async adminUpdate(id, dto) {
        const quiz = await this.prisma.quiz.findUnique({ where: { id } });
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not found');
        return this.prisma.quiz.update({ where: { id }, data: dto });
    }
    async adminDelete(id) {
        const quiz = await this.prisma.quiz.findUnique({ where: { id } });
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not found');
        await this.prisma.quiz.delete({ where: { id } });
        return { message: 'Quiz deleted' };
    }
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
    async findOne(id) {
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
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not found');
        return quiz;
    }
    async purchase(userId, quizId, paymentMethod) {
        const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId, isActive: true } });
        if (!quiz)
            throw new common_1.NotFoundException('Quiz not found');
        const existing = await this.prisma.quizPurchase.findFirst({
            where: { userId, quizId },
        });
        if (existing)
            throw new common_1.BadRequestException('You have already purchased this quiz');
        const price = Number(quiz.price);
        if (paymentMethod === 'WALLET') {
            const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
            if (!wallet)
                throw new common_1.NotFoundException('Wallet not found');
            if (Number(wallet.balance) < price) {
                throw new common_1.BadRequestException('Insufficient wallet balance');
            }
            return this.prisma.$transaction(async (tx) => {
                await this.walletService.debit(tx, wallet.id, price, 'QUIZ_PURCHASE', `Quiz purchase: ${quiz.title}`, quizId);
                const purchase = await tx.quizPurchase.create({
                    data: { userId, quizId, paymentMethod: 'WALLET' },
                });
                return purchase;
            });
        }
        else if (paymentMethod === 'BKASH') {
            return this.prisma.quizPurchase.create({
                data: { userId, quizId, paymentMethod: 'BKASH' },
            });
        }
        else {
            throw new common_1.BadRequestException('Invalid payment method');
        }
    }
    async getPurchased(userId) {
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
    async startAttempt(userId, purchaseId) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: { quiz: { include: { questions: { orderBy: { sortOrder: 'asc' } } } } },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.userId !== userId)
            throw new common_1.ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED')
            throw new common_1.BadRequestException('Quiz already completed or timed out');
        if (!purchase.startedAt) {
            await this.prisma.quizPurchase.update({
                where: { id: purchaseId },
                data: { startedAt: new Date() },
            });
        }
        const questions = purchase.quiz.questions.map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options,
        }));
        return {
            purchase,
            quiz: { title: purchase.quiz.title, timeLimit: purchase.quiz.timeLimit },
            questions,
            startedAt: purchase.startedAt || new Date(),
        };
    }
    async submitAttempt(userId, purchaseId, dto) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: { quiz: { include: { questions: true } } },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.userId !== userId)
            throw new common_1.ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED')
            throw new common_1.BadRequestException('Quiz already completed or timed out');
        const timeLimitMs = purchase.quiz.timeLimit * 60 * 1000;
        const startedAt = purchase.startedAt || new Date();
        const elapsed = Date.now() - startedAt.getTime();
        const timedOut = elapsed > timeLimitMs;
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
                answers: dto.answers,
                completedAt: new Date(),
            },
        });
        return { status, score, totalQuestions: questions.length, timedOut };
    }
};
exports.QuizService = QuizService;
exports.QuizService = QuizService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], QuizService);
//# sourceMappingURL=quiz.service.js.map