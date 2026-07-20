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
const sync_1 = require("csv-parse/sync");
const PRICE_PER_QUESTION = 1;
let QuizService = class QuizService {
    prisma;
    walletService;
    constructor(prisma, walletService) {
        this.prisma = prisma;
        this.walletService = walletService;
    }
    async addQuestions(categoryId, dtos, levelId) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id: categoryId } });
        if (!cat)
            throw new common_1.NotFoundException('Quiz category not found');
        if (levelId) {
            const level = await this.prisma.quizLevel.findUnique({ where: { id: levelId } });
            if (!level || level.categoryId !== categoryId)
                throw new common_1.NotFoundException('Quiz level not found in this category');
        }
        const maxOrder = await this.prisma.quizQuestion.aggregate({
            where: { categoryId },
            _max: { sortOrder: true },
        });
        let startOrder = (maxOrder._max.sortOrder ?? -1) + 1;
        const questions = dtos.map((dto) => ({
            categoryId,
            levelId: levelId ?? null,
            question: dto.question,
            options: dto.options,
            correctIndex: dto.correctIndex,
            sortOrder: dto.sortOrder ?? startOrder++,
        }));
        await this.prisma.quizQuestion.createMany({ data: questions });
        return { message: `${questions.length} questions added` };
    }
    async importCsv(categoryId, file) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id: categoryId } });
        if (!cat)
            throw new common_1.NotFoundException('Quiz category not found');
        const csv = file.buffer.toString('utf-8');
        let records;
        try {
            records = (0, sync_1.parse)(csv, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true,
            });
        }
        catch {
            throw new common_1.BadRequestException('Invalid CSV format');
        }
        if (records.length === 0)
            throw new common_1.BadRequestException('CSV is empty');
        const levels = await this.prisma.quizLevel.findMany({
            where: { categoryId },
            select: { id: true, name: true },
        });
        const levelMap = new Map();
        for (const l of levels)
            levelMap.set(l.name.toLowerCase(), l.id);
        const errors = [];
        const questions = [];
        let maxOrder = (await this.prisma.quizQuestion.aggregate({
            where: { categoryId },
            _max: { sortOrder: true },
        }))._max.sortOrder ?? -1;
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2;
            if (!row.question || !row.question.trim()) {
                errors.push({ row: rowNum, message: 'question is required' });
                continue;
            }
            const options = [row.option1, row.option2, row.option3, row.option4];
            if (options.some((o) => !o || !o.trim())) {
                errors.push({ row: rowNum, message: 'all 4 options (option1-option4) are required' });
                continue;
            }
            const correctIndex = Number(row.correctIndex);
            if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
                errors.push({ row: rowNum, message: 'correctIndex must be 0, 1, 2, or 3' });
                continue;
            }
            let levelId = null;
            if (row.level && row.level.trim()) {
                const found = levelMap.get(row.level.trim().toLowerCase());
                if (found) {
                    levelId = found;
                }
                else {
                    errors.push({ row: rowNum, message: `level "${row.level}" not found in this category` });
                    continue;
                }
            }
            const sortOrder = row.sortOrder !== undefined && row.sortOrder !== ''
                ? Number(row.sortOrder)
                : ++maxOrder;
            questions.push({
                categoryId,
                levelId,
                question: row.question.trim(),
                options,
                correctIndex,
                sortOrder,
            });
        }
        if (questions.length > 0) {
            await this.prisma.quizQuestion.createMany({ data: questions });
        }
        return {
            imported: questions.length,
            errors,
            total: records.length,
        };
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
                include: { level: { select: { id: true, name: true } } },
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
        const questionWhere = { categoryId };
        let levelName = null;
        if (dto.levelId) {
            const level = await this.prisma.quizLevel.findUnique({ where: { id: dto.levelId } });
            if (!level || level.categoryId !== categoryId)
                throw new common_1.NotFoundException('Quiz level not found');
            questionWhere.levelId = dto.levelId;
            levelName = level.name;
        }
        const totalQuestions = await this.prisma.quizQuestion.count({
            where: questionWhere,
        });
        if (totalQuestions === 0)
            throw new common_1.BadRequestException('No questions available');
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
                await this.walletService.debit(tx, wallet.id, price, 'QUIZ_PURCHASE', `Quiz purchase: ${count} questions from ${cat.name}${levelName ? ` (${levelName})` : ''}`, categoryId);
                const purchase = await tx.quizPurchase.create({
                    data: { userId, categoryId, levelId: dto.levelId ?? null, questionCount: count, totalPrice: price, paymentMethod: 'WALLET' },
                });
                return purchase;
            });
        }
        else if (method === 'BKASH') {
            return this.prisma.quizPurchase.create({
                data: { userId, categoryId, levelId: dto.levelId ?? null, questionCount: count, totalPrice: price, paymentMethod: 'BKASH' },
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
                level: { select: { id: true, name: true } },
                _count: { select: { answers: true } },
            },
            orderBy: { purchasedAt: 'desc' },
        });
    }
    async startAttempt(userId, purchaseId) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.userId !== userId)
            throw new common_1.ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED')
            throw new common_1.BadRequestException('Quiz already completed');
        const full = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: {
                category: {
                    include: {
                        questions: {
                            where: purchase.levelId ? { levelId: purchase.levelId } : undefined,
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
        });
        const allQuestions = full?.category.questions ?? [];
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
            category: { id: purchase.categoryId, name: full.category.name, imageUrl: full.category.imageUrl },
            questionCount: purchase.questionCount,
            questions: selected,
            currentIndex: purchase.currentIndex,
            startedAt: purchase.startedAt || new Date(),
        };
    }
    async submitAnswer(userId, purchaseId, dto) {
        const purchase = await this.prisma.quizPurchase.findUnique({ where: { id: purchaseId } });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.userId !== userId)
            throw new common_1.ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED')
            throw new common_1.BadRequestException('Quiz already completed');
        const full = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: {
                category: {
                    include: {
                        questions: {
                            where: purchase.levelId ? { levelId: purchase.levelId } : undefined,
                        },
                    },
                },
            },
        });
        const existing = await this.prisma.quizAnswer.findFirst({
            where: { purchaseId, questionId: dto.questionId },
        });
        if (existing)
            throw new common_1.BadRequestException('Already answered this question');
        const question = full.category.questions.find((q) => q.id === dto.questionId);
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
                const catName = full.category?.name || 'Quiz';
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
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.userId !== userId)
            throw new common_1.ForbiddenException('Not your purchase');
        const full = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
            include: {
                category: {
                    include: {
                        questions: {
                            where: purchase.levelId ? { levelId: purchase.levelId } : undefined,
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
        });
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
        const shuffled = [...(full?.category.questions ?? [])].sort(() => Math.random() - 0.5);
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