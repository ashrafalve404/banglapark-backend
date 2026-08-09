import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateQuestionDto, PurchaseDto, SubmitAnswerDto } from './dto/quiz.dto';
import { parse } from 'csv-parse/sync';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

const PRICE_PER_QUESTION = 1;

@Injectable()
export class QuizService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
        private readonly notificationsService: NotificationsService,
    ) { }

    // ── Admin: Question CRUD ─────────────────────────────────────────────────

    async addQuestions(categoryId: string, dtos: CreateQuestionDto[], levelId?: string) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id: categoryId } });
        if (!cat) throw new NotFoundException('Quiz category not found');

        if (levelId) {
            const level = await this.prisma.quizLevel.findUnique({ where: { id: levelId } });
            if (!level || level.categoryId !== categoryId) throw new NotFoundException('Quiz level not found in this category');
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

    async importCsv(categoryId: string, file: Express.Multer.File) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id: categoryId } });
        if (!cat) throw new NotFoundException('Quiz category not found');

        const csv = file.buffer.toString('utf-8');
        let records: any[];
        try {
            records = parse(csv, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                relax_column_count: true,
            });
        } catch {
            throw new BadRequestException('Invalid CSV format');
        }

        if (records.length === 0) throw new BadRequestException('CSV is empty');

        const levels = await this.prisma.quizLevel.findMany({
            where: { categoryId },
            select: { id: true, name: true },
        });

        const levelMap = new Map<string, string>();
        for (const l of levels) levelMap.set(l.name.toLowerCase(), l.id);

        const errors: { row: number; message: string }[] = [];
        const questions: any[] = [];

        let maxOrder = (await this.prisma.quizQuestion.aggregate({
            where: { categoryId },
            _max: { sortOrder: true },
        }))._max.sortOrder ?? -1;

        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2; // header is row 1

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

            let levelId: string | null = null;
            if (row.level && row.level.trim()) {
                const found = levelMap.get(row.level.trim().toLowerCase());
                if (found) {
                    levelId = found;
                } else {
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

    async getQuestions(categoryId: string, page = 1, limit = 50) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id: categoryId } });
        if (!cat) throw new NotFoundException('Quiz category not found');

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

    async updateQuestion(id: string, dto: Partial<CreateQuestionDto>) {
        const q = await this.prisma.quizQuestion.findUnique({ where: { id } });
        if (!q) throw new NotFoundException('Question not found');
        return this.prisma.quizQuestion.update({ where: { id }, data: dto });
    }

    async deleteQuestion(id: string) {
        const q = await this.prisma.quizQuestion.findUnique({ where: { id } });
        if (!q) throw new NotFoundException('Question not found');
        await this.prisma.quizAnswer.deleteMany({
            where: { questionId: id },
        });
        await this.prisma.quizQuestion.delete({ where: { id } });
        return { message: 'Question deleted' };
    }

    async bulkDeleteQuestions(ids: string[]) {
        if (!ids || ids.length === 0) return { count: 0 };
        await this.prisma.quizAnswer.deleteMany({
            where: { questionId: { in: ids } },
        });
        const result = await this.prisma.quizQuestion.deleteMany({
            where: { id: { in: ids } },
        });
        return { count: result.count, message: `${result.count} questions deleted` };
    }

    async deleteAllQuestions(categoryId: string) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id: categoryId } });
        if (!cat) throw new NotFoundException('Quiz category not found');
        await this.prisma.quizAnswer.deleteMany({
            where: { question: { categoryId } },
        });
        const result = await this.prisma.quizQuestion.deleteMany({ where: { categoryId } });
        return { count: result.count, message: `All ${result.count} questions deleted from category` };
    }

    // ── User: Purchase ───────────────────────────────────────────────────────

    async purchase(userId: string, categoryId: string, dto: PurchaseDto) {
        if (dto.questionCount < 20) {
            throw new BadRequestException('Minimum 20 questions must be purchased per purchase.');
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const purchasesToday = await this.prisma.quizPurchase.count({
            where: {
                userId,
                purchasedAt: {
                    gte: startOfToday,
                },
            },
        });

        if (purchasesToday >= 20) {
            throw new BadRequestException('Daily purchase limit over!');
        }

        const cat = await this.prisma.quizCategory.findUnique({
            where: { id: categoryId, isActive: true },
        });
        if (!cat) throw new NotFoundException('Category not found');

        const questionWhere: any = { categoryId };
        let levelName: string | null = null;
        if (dto.levelId) {
            const level = await this.prisma.quizLevel.findUnique({ where: { id: dto.levelId } });
            if (!level || level.categoryId !== categoryId) throw new NotFoundException('Quiz level not found');
            questionWhere.levelId = dto.levelId;
            levelName = level.name;
        }

        const totalQuestions = await this.prisma.quizQuestion.count({
            where: questionWhere,
        });
        if (totalQuestions === 0) throw new BadRequestException('No questions available');

        const count = Math.min(dto.questionCount, totalQuestions);
        const price = count * PRICE_PER_QUESTION;
        const method = dto.paymentMethod || 'WALLET';

        let purchase: any;

        if (method === 'WALLET') {
            const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
            if (!wallet) throw new NotFoundException('Wallet not found');
            if (Number(wallet.balance) < price) {
                throw new BadRequestException('Insufficient wallet balance');
            }

            purchase = await this.prisma.$transaction(async (tx: any) => {
                await this.walletService.debit(tx, wallet.id, price, 'QUIZ_PURCHASE', `Quiz purchase: ${count} questions from ${cat.name}${levelName ? ` (${levelName})` : ''}`, categoryId);

                const created = await tx.quizPurchase.create({
                    data: { userId, categoryId, levelId: dto.levelId ?? null, questionCount: count, totalPrice: price, paymentMethod: 'WALLET' },
                });
                return created;
            });
        } else if (method === 'BKASH') {
            purchase = await this.prisma.quizPurchase.create({
                data: { userId, categoryId, levelId: dto.levelId ?? null, questionCount: count, totalPrice: price, paymentMethod: 'BKASH' },
            });
        } else {
            throw new BadRequestException('Invalid payment method');
        }

        // Trigger notifications asynchronously
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, phone: true },
            });
            const userName = user?.name || "User";
            const userPhone = user?.phone || "";

            // Notify user
            await this.notificationsService.create(
                userId,
                NotificationType.SYSTEM,
                "Quiz Purchased Successfully",
                `You purchased ${count} questions from category "${cat.name}" for BDT ${price} using ${method}.`,
            );

            // Notify admins instantly
            await this.notificationsService.notifyAdmins(
                NotificationType.SYSTEM,
                "New Quiz Purchase 🧠",
                `User ${userName} (${userPhone}) has purchased ${count} questions from "${cat.name}" for BDT ${price} using ${method}.`,
            );
        } catch (err) {
            console.error(`Failed to send quiz purchase notifications: ${err.message}`);
        }

        return purchase;
    }

    async getPurchased(userId: string) {
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

    // ── User: Attempt ────────────────────────────────────────────────────────

    async startAttempt(userId: string, purchaseId: string) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
        });
        if (!purchase) throw new NotFoundException('Purchase not found');
        if (purchase.userId !== userId) throw new ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED') throw new BadRequestException('Quiz already completed');

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

        // Select N random questions from the category (filtered by level if purchased for a level)
        const allQuestions = full?.category.questions ?? [];
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, purchase.questionCount).map((q) => ({
            id: q.id,
            question: q.question,
            options: q.options as string[],
        }));

        // Initialize start time if first access
        if (!purchase.startedAt) {
            await this.prisma.quizPurchase.update({
                where: { id: purchaseId },
                data: { startedAt: new Date() },
            });
        }

        return {
            purchaseId: purchase.id,
            category: { id: purchase.categoryId, name: full!.category.name, imageUrl: full!.category.imageUrl },
            questionCount: purchase.questionCount,
            questions: selected,
            currentIndex: purchase.currentIndex,
            startedAt: purchase.startedAt || new Date(),
        };
    }

    async abandonAttempt(userId: string, purchaseId: string) {
        const purchase = await this.prisma.quizPurchase.findUnique({ where: { id: purchaseId } });
        if (!purchase) return { status: 'NOT_FOUND' };
        if (purchase.userId !== userId) return { status: 'FORBIDDEN' };
        if (purchase.status !== 'PURCHASED') return { status: 'ALREADY_COMPLETED' };

        const answers = await this.prisma.quizAnswer.findMany({ where: { purchaseId } });

        const correctCount = answers.filter((a) => a.isCorrect).length;
        const wrongCount = answers.filter((a) => !a.isCorrect && a.selectedIndex !== null && a.selectedIndex >= 0).length;
        const skippedCount = answers.filter((a) => a.selectedIndex === null || a.selectedIndex < 0).length;
        const netReward = correctCount * 2 - wrongCount * 2;

        // Mark as completed immediately
        await this.prisma.quizPurchase.update({
            where: { id: purchaseId },
            data: { status: 'COMPLETED', completedAt: new Date(), currentIndex: answers.length },
        });

        // Pay out whatever was earned from answered questions only
        if (netReward !== 0) {
            const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
            const catName = purchase.categoryId ?? 'Quiz';
            if (wallet) {
                if (netReward > 0) {
                    await this.walletService.credit(
                        this.prisma,
                        wallet.id,
                        netReward,
                        'QUIZ_EARNING',
                        `Quiz reward (abandoned): ${correctCount} correct × 2tk - ${wrongCount} wrong × 2tk = ${netReward}tk`,
                        purchaseId,
                    );
                } else {
                    try {
                        await this.walletService.debit(
                            this.prisma,
                            wallet.id,
                            Math.abs(netReward),
                            'QUIZ_EARNING',
                            `Quiz penalty (abandoned): ${wrongCount} wrong × 2tk = ${Math.abs(netReward)}tk`,
                            purchaseId,
                        );
                    } catch {
                        // Ignore insufficient balance
                    }
                }
            }
        }

        return { status: 'ABANDONED', answeredCount: answers.length, score: correctCount, wrongCount, skippedCount, netReward };
    }

    async submitAnswer(userId: string, purchaseId: string, dto: SubmitAnswerDto) {
        const purchase = await this.prisma.quizPurchase.findUnique({ where: { id: purchaseId } });
        if (!purchase) throw new NotFoundException('Purchase not found');
        if (purchase.userId !== userId) throw new ForbiddenException('Not your purchase');
        if (purchase.status !== 'PURCHASED') throw new BadRequestException('Quiz already completed');

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
        // Check if already answered this question
        const existing = await this.prisma.quizAnswer.findFirst({
            where: { purchaseId, questionId: dto.questionId },
        });
        if (existing) {
            // Already answered, check progress
            const answers = await this.prisma.quizAnswer.findMany({ where: { purchaseId } });
            const isLast = answers.length >= purchase.questionCount;
            return { status: isLast ? 'COMPLETED' : 'IN_PROGRESS', currentIndex: answers.length, isLast };
        }

        // Find the question and check answer
        const question = full!.category.questions.find((q) => q.id === dto.questionId);
        if (!question) throw new BadRequestException('Question not found in this category');

        const isCorrect = dto.selectedIndex >= 0 && question.correctIndex === dto.selectedIndex;

        await this.prisma.quizAnswer.create({
            data: {
                purchaseId,
                questionId: dto.questionId,
                selectedIndex: dto.selectedIndex,
                isCorrect,
            },
        });

        // Calculate total answered for this purchase
        const answers = await this.prisma.quizAnswer.findMany({
            where: { purchaseId },
        });
        const totalAnswered = answers.length;
        const isLast = totalAnswered >= purchase.questionCount;

        if (isLast) {
            // Calculate score and reward
            const correctCount = answers.filter((a) => a.isCorrect).length;
            const wrongCount = answers.filter((a) => !a.isCorrect && a.selectedIndex !== null && a.selectedIndex >= 0).length;
            const skippedCount = answers.filter((a) => a.selectedIndex === null || a.selectedIndex < 0).length;
            const netReward = correctCount * 2 - wrongCount * 2;

            // Award or deduct reward to wallet
            const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
            if (wallet && netReward !== 0) {
                const catName = full!.category?.name || 'Quiz';
                if (netReward > 0) {
                    await this.walletService.credit(
                        this.prisma,
                        wallet.id,
                        netReward,
                        'QUIZ_EARNING',
                        `Quiz reward: ${correctCount} correct × 2tk - ${wrongCount} wrong × 2tk = ${netReward}tk (${catName})`,
                        purchaseId,
                    );
                } else {
                    const debitAmount = Math.abs(netReward);
                    try {
                        await this.walletService.debit(
                            this.prisma,
                            wallet.id,
                            debitAmount,
                            'QUIZ_EARNING',
                            `Quiz penalty: ${wrongCount} wrong × 2tk = ${debitAmount}tk (${catName})`,
                            purchaseId,
                        );
                    } catch {
                        // Allow completion even if wallet has insufficient balance for penalty
                    }
                }
            }

            await this.prisma.quizPurchase.update({
                where: { id: purchaseId },
                data: { currentIndex: totalAnswered, status: 'COMPLETED', completedAt: new Date() },
            });

            return { status: 'COMPLETED', score: correctCount, wrongCount, skippedCount, totalQuestions: purchase.questionCount, isLast: true, netReward };
        } else {
            await this.prisma.quizPurchase.update({
                where: { id: purchaseId },
                data: { currentIndex: totalAnswered },
            });

            return { status: 'IN_PROGRESS', currentIndex: totalAnswered, isLast: false };
        }
    }

    async getNextQuestion(userId: string, purchaseId: string) {
        const purchase = await this.prisma.quizPurchase.findUnique({
            where: { id: purchaseId },
        });
        if (!purchase) throw new NotFoundException('Purchase not found');
        if (purchase.userId !== userId) throw new ForbiddenException('Not your purchase');

        const answers = await this.prisma.quizAnswer.findMany({ where: { purchaseId } });
        const answeredCount = answers.length;
        const correctCount = answers.filter((a) => a.isCorrect).length;
        const wrongCount = answers.filter((a) => !a.isCorrect && a.selectedIndex !== null && a.selectedIndex >= 0).length;
        const skippedCount = answers.filter((a) => a.selectedIndex === null || a.selectedIndex < 0).length;

        if (purchase.status !== 'PURCHASED' || answeredCount >= purchase.questionCount) {
            if (purchase.status === 'PURCHASED') {
                await this.prisma.quizPurchase.update({
                    where: { id: purchaseId },
                    data: { status: 'COMPLETED', completedAt: new Date() },
                });
            }
            const netReward = correctCount * 2 - wrongCount * 2;
            return { status: 'COMPLETED', score: correctCount, wrongCount, skippedCount, totalQuestions: purchase.questionCount, completed: true, netReward };
        }

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

        const getQuestionScore = (qId: string, pId: string) => {
            let hash = 0;
            const str = qId + pId;
            for (let i = 0; i < str.length; i++) {
                hash = (hash << 5) - hash + str.charCodeAt(i);
                hash |= 0;
            }
            return hash;
        };

        const allQuestions = full?.category.questions ?? [];
        if (allQuestions.length === 0) throw new BadRequestException('No questions available in this category');

        const deterministicSorted = [...allQuestions].sort((a, b) => getQuestionScore(a.id, purchaseId) - getQuestionScore(b.id, purchaseId));
        const currentQ = deterministicSorted[answeredCount % deterministicSorted.length];

        return {
            status: 'IN_PROGRESS',
            question: {
                id: currentQ.id,
                question: currentQ.question,
                options: currentQ.options as string[],
            },
            currentIndex: answeredCount,
            answeredCount,
            totalQuestions: purchase.questionCount,
            completed: false,
        };
    }

    async getResult(userId: string, purchaseId: string) {
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
        if (!purchase) throw new NotFoundException('Purchase not found');
        if (purchase.userId !== userId) throw new ForbiddenException('Not your purchase');

        const correctCount = purchase.answers.filter((a) => a.isCorrect).length;
        const wrongCount = purchase.answers.filter((a) => !a.isCorrect && a.selectedIndex !== null && a.selectedIndex >= 0).length;
        const skippedCount = purchase.answers.filter((a) => a.selectedIndex === null || a.selectedIndex < 0).length;
        const netReward = correctCount * 2 - wrongCount * 2;

        return {
            purchaseId: purchase.id,
            category: purchase.category,
            questionCount: purchase.questionCount,
            score: correctCount,
            wrongCount,
            skippedCount,
            netReward,
            status: purchase.status,
            startedAt: purchase.startedAt,
            completedAt: purchase.completedAt,
            answers: purchase.answers.map((a) => ({
                question: a.question.question,
                options: a.question.options as string[],
                correctIndex: a.question.correctIndex,
                selectedIndex: a.selectedIndex,
                isCorrect: a.isCorrect,
            })),
        };
    }

    async getAdminStats() {
        const totalQuizzesSold = await this.prisma.quizPurchase.count();
        const aggregate = await this.prisma.quizPurchase.aggregate({
            _sum: {
                totalPrice: true,
                questionCount: true,
            },
        });
        const totalRevenue = Number(aggregate._sum.totalPrice ?? 0);
        const totalQuestionsSold = Number(aggregate._sum.questionCount ?? 0);

        const completedQuizzes = await this.prisma.quizPurchase.count({
            where: { status: 'COMPLETED' },
        });

        // Compute total user rewards paid from permanent WalletTransaction records so deleting questions/categories never affects Net Profit
        const quizEarnings = await this.prisma.walletTransaction.aggregate({
            where: {
                type: 'QUIZ_EARNING',
                amount: { gt: 0 },
            },
            _sum: {
                amount: true,
            },
        });
        const totalUserRewardsPaid = Number(quizEarnings._sum.amount ?? 0);
        const netProfit = totalRevenue - totalUserRewardsPaid;

        const categories = await this.prisma.quizCategory.findMany({
            include: {
                _count: { select: { questions: true, purchases: true } },
                purchases: {
                    select: { totalPrice: true, questionCount: true },
                },
            },
        });

        const categoryStats = categories.map((cat) => {
            const catRevenue = cat.purchases.reduce((sum, p) => sum + Number(p.totalPrice), 0);
            const catQuestionsSold = cat.purchases.reduce((sum, p) => sum + p.questionCount, 0);
            return {
                id: cat.id,
                name: cat.name,
                imageUrl: cat.imageUrl,
                totalQuestions: cat._count.questions,
                totalSold: cat._count.purchases,
                totalQuestionsSold: catQuestionsSold,
                totalRevenue: catRevenue,
            };
        });

        const recentPurchases = await this.prisma.quizPurchase.findMany({
            take: 50,
            orderBy: { purchasedAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, phone: true, email: true } },
                category: { select: { id: true, name: true, imageUrl: true } },
                answers: { select: { isCorrect: true } },
            },
        });

        const purchaseIds = recentPurchases.map((p) => p.id);
        const quizTxList = await this.prisma.walletTransaction.findMany({
            where: {
                type: 'QUIZ_EARNING',
                referenceId: { in: purchaseIds },
            },
        });

        const txMap = new Map<string, number>();
        for (const tx of quizTxList) {
            if (tx.referenceId && Number(tx.amount) > 0) {
                txMap.set(tx.referenceId, Number(tx.amount));
            }
        }

        const userPurchaseLogs = recentPurchases.map((p) => {
            const correctCount = p.answers.filter((a) => a.isCorrect === true).length;
            const wrongCount = p.answers.filter((a) => a.isCorrect === false).length;
            let userReward = 0;
            if (p.status === 'COMPLETED') {
                if (p.answers.length > 0) {
                    userReward = Math.max(0, correctCount * 2 - wrongCount * 2);
                } else {
                    userReward = txMap.get(p.id) ?? 0;
                }
            }
            const pricePaid = Number(p.totalPrice);
            const platformProfit = pricePaid - userReward;

            return {
                id: p.id,
                user: p.user,
                category: p.category,
                questionCount: p.questionCount,
                pricePaid,
                correctCount,
                wrongCount,
                userReward,
                platformProfit,
                status: p.status,
                purchasedAt: p.purchasedAt,
                completedAt: p.completedAt,
            };
        });

        return {
            totalQuizzesSold,
            completedQuizzes,
            totalQuestionsSold,
            totalRevenue,
            totalUserRewardsPaid,
            netProfit,
            categoryStats,
            userPurchaseLogs,
        };
    }
}
