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
const PRICE_PER_QUESTION = 1;
let QuizService = class QuizService {
    prisma;
    walletService;
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
    }
    async addQuestions(categoryId, dtos) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id: categoryId } });
        if (!cat)
            throw new common_1.NotFoundException('Quiz category not found');
        const maxOrder = await this.prisma.quizQuestion.aggregate({
            where: { categoryId },
            _max: { sortOrder: true },
        });
        let startOrder = (maxOrder._max.sortOrder ?? -1) + 1;
        const questions = dtos.map((dto) => ({
            categoryId,
            question: dto.question,
            options: dto.options,
            correctIndex: dto.correctIndex,
            sortOrder: dto.sortOrder ?? startOrder++,
        }));
        await this.prisma.quizQuestion.createMany({ data: questions });
        return { message: `${questions.length} questions added` };
    }
    async getQuestions(categoryId, page = 1, limit = 50) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id: categoryId } });
        if (!cat)
            throw new common_1.NotFoundException('Quiz category not found');
        const skip = (page - 1) * limit;
        const [questions, total] = await Promise.all([
            this.prisma.quizQuestion.findMany({
                where: { categoryId },
                orderBy: { sortOrder: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.quizQuestion.count({ where: { categoryId } }),
        ]);
        return { questions, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async updateQuestion(id, dto) {
        const q = await this.prisma.quizQuestion.findUnique({ where: { id } });
        if (!q)
            throw new common_1.NotFoundException('Question not found');
        return this.prisma.quizQuestion.update({ where: { id }, data: dto });
    }
    async deleteQuestion(id) {
        const q = await this.prisma.quizQuestion.findUnique({ where: { id } });
        if (!q)
            throw new common_1.NotFoundException('Question not found');
        await this.prisma.quizQuestion.delete({ where: { id } });
        return { message: 'Question deleted' };
    }
    async purchase(userId, categoryId, dto) {
        const cat = await this.prisma.quizCategory.findUnique({
            where: { id: categoryId, isActive: true },
        });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        const totalQuestions = await this.prisma.quizQuestion.count({
            where: { categoryId },
        });
        if (totalQuestions === 0)
            throw new common_1.BadRequestException('No questions available in this category');
        const count = Math.min(dto.questionCount, totalQuestions);
        const price = count * PRICE_PER_QUESTION;
        const method = dto.paymentMethod || 'WALLET';
        if (method === 'WALLET') {
            const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
            if (!wallet)
                throw new common_1.NotFoundException('Wallet not found');
            if (Number(wallet.balance) < price) {
                throw new common_1.BadRequestException('Insufficient wallet balance');
            }
            return this.prisma.$transaction(async (tx) => {
                await this.walletService.debit(tx, wallet.id, price, 'QUIZ_PURCHASE', `Quiz purchase: ${count} questions from ${cat.name}`, categoryId);
                const purchase = await tx.quizPurchase.create({
                    data: { userId, categoryId, questionCount: count, totalPrice: price, paymentMethod: 'WALLET' },
                });
                return purchase;
            });
        }
        else if (method === 'BKASH') {
            return this.prisma.quizPurchase.create({
                data: { userId, categoryId, questionCount: count, totalPrice: price, paymentMethod: 'BKASH' },
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
                category: { select: { id: true, name: true, imageUrl: true } },
                _count: { select: { answers: true } },
            },
            orderBy: { purchasedAt: 'desc' },
        });
    }
    async startAttempt(userId, purchaseId) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: { category: { include: { questions: { orderBy: { sortOrder: 'asc' } } } } },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.userId !== userId)
            throw new common_1.ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED')
            throw new common_1.BadRequestException('Quiz already completed');
        const allQuestions = purchase.category.questions;
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, purchase.questionCount).map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options,
        }));
        if (!purchase.startedAt) {
            await this.prisma.quizPurchase.update({
                where: { id: purchaseId },
                data: { startedAt: new Date() },
            });
        }
        return {
            purchaseId: purchase.id,
            category: { id: purchase.categoryId, name: purchase.category.name, imageUrl: purchase.category.imageUrl },
            questionCount: purchase.questionCount,
            questions: selected,
            currentIndex: purchase.currentIndex,
            startedAt: purchase.startedAt || new Date(),
        };
    }
    async submitAnswer(userId, purchaseId, dto) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: { category: { include: { questions: true } } },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.userId !== userId)
            throw new common_1.ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED')
            throw new common_1.BadRequestException('Quiz already completed');
        const existing = await this.prisma.quizAnswer.findFirst({
            where: { purchaseId, questionId: dto.questionId },
        });
        if (existing)
            throw new common_1.BadRequestException('Already answered this question');
        const question = purchase.category.questions.find((q) => q.id === dto.questionId);
        if (!question)
            throw new common_1.BadRequestException('Question not found in this category');
        const isCorrect = question.correctIndex === dto.selectedIndex;
        await this.prisma.quizAnswer.create({
            data: {
                purchaseId,
                questionId: dto.questionId,
                selectedIndex: dto.selectedIndex,
                isCorrect,
            },
        });
        const nextIndex = purchase.currentIndex + 1;
        const isLast = nextIndex >= purchase.questionCount;
        if (isLast) {
            const answers = await this.prisma.quizAnswer.findMany({
                where: { purchaseId },
            });
            const correctCount = answers.filter((a) => a.isCorrect).length;
            const wrongCount = answers.length - correctCount;
            const netReward = correctCount * 2 - wrongCount * 1;
            const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
            if (wallet && netReward !== 0) {
                const catName = purchase.category?.name || 'Quiz';
                if (netReward > 0) {
                    await this.walletService.credit(this.prisma, wallet.id, netReward, 'QUIZ_EARNING', `Quiz reward: ${correctCount} correct × 2tk - ${wrongCount} wrong × 1tk = ${netReward}tk (${catName})`, purchaseId);
                }
                else {
                    const debitAmount = Math.abs(netReward);
                    try {
                        await this.walletService.debit(this.prisma, wallet.id, debitAmount, 'QUIZ_EARNING', `Quiz penalty: ${wrongCount} wrong × 1tk = ${debitAmount}tk (${catName})`, purchaseId);
                    }
                    catch {
                    }
                }
            }
            await this.prisma.quizPurchase.update({
                where: { id: purchaseId },
                data: { currentIndex: nextIndex, status: 'COMPLETED', completedAt: new Date() },
            });
            return { status: 'COMPLETED', score: correctCount, totalQuestions: purchase.questionCount, isLast: true, netReward };
        }
        else {
            await this.prisma.quizPurchase.update({
                where: { id: purchaseId },
                data: { currentIndex: nextIndex },
            });
            return { status: 'IN_PROGRESS', currentIndex: nextIndex, isLast: false };
        }
    }
    async getNextQuestion(userId, purchaseId) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: { category: { include: { questions: { orderBy: { sortOrder: 'asc' } } } } },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.userId !== userId)
            throw new common_1.ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED') {
            const answers = await this.prisma.quizAnswer.findMany({ where: { purchaseId } });
            const correctCount = answers.filter((a) => a.isCorrect).length;
            const wrongCount = answers.length - correctCount;
            const netReward = correctCount * 2 - wrongCount * 1;
            return { status: purchase.status, score: correctCount, totalQuestions: purchase.questionCount, completed: true, netReward };
        }
        const answeredIds = new Set((await this.prisma.quizAnswer.findMany({
            where: { purchaseId },
            select: { questionId: true },
        })).map((a) => a.questionId));
        const shuffled = [...purchase.category.questions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, purchase.questionCount);
        const unanswered = selected.filter((q) => !answeredIds.has(q.id));
        if (unanswered.length === 0) {
            const answers = await this.prisma.quizAnswer.findMany({ where: { purchaseId } });
            const score = answers.filter((a) => a.isCorrect).length;
            await this.prisma.quizPurchase.update({
                where: { id: purchaseId },
                data: { status: 'COMPLETED', completedAt: new Date() },
            });
            return { status: 'COMPLETED', score, totalQuestions: purchase.questionCount, completed: true };
        }
        return {
            status: 'IN_PROGRESS',
            question: {
                id: unanswered[0].id,
                question: unanswered[0].question,
                options: unanswered[0].options,
            },
            currentIndex: purchase.currentIndex,
            totalQuestions: purchase.questionCount,
            answeredCount: answeredIds.size,
            completed: false,
        };
    }
    async getResult(userId, purchaseId) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: {
                category: { select: { id: true, name: true, imageUrl: true } },
                answers: {
                    include: { question: { select: { question: true, options: true, correctIndex: true } } },
                    orderBy: { answeredAt: 'asc' },
                },
            },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.userId !== userId)
            throw new common_1.ForbiddenException('Not your purchase');
        const correctCount = purchase.answers.filter((a) => a.isCorrect).length;
        const wrongCount = purchase.answers.length - correctCount;
        const netReward = correctCount * 2 - wrongCount * 1;
        return {
            purchaseId: purchase.id,
            category: purchase.category,
            questionCount: purchase.questionCount,
            score: correctCount,
            netReward,
            status: purchase.status,
            startedAt: purchase.startedAt,
            completedAt: purchase.completedAt,
            answers: purchase.answers.map((a) => ({
                question: a.question.question,
                options: a.question.options,
                correctIndex: a.question.correctIndex,
                selectedIndex: a.selectedIndex,
                isCorrect: a.isCorrect,
            })),
        };
    }
};
exports.QuizService = QuizService;
exports.QuizService = QuizService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService])
], QuizService);
//# sourceMappingURL=quiz.service.js.map