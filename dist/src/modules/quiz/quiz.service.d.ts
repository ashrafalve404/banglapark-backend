import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateQuestionDto, PurchaseDto, SubmitAnswerDto } from './dto/quiz.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class QuizService {
    private readonly prisma;
    private readonly walletService;
    private readonly notificationsService;
    constructor(prisma: PrismaService, walletService: WalletService, notificationsService: NotificationsService);
    addQuestions(categoryId: string, dtos: CreateQuestionDto[], levelId?: string): Promise<{
        message: string;
    }>;
    importCsv(categoryId: string, file: Express.Multer.File): Promise<{
        imported: number;
        errors: {
            row: number;
            message: string;
        }[];
        total: number;
    }>;
    getQuestions(categoryId: string, page?: number, limit?: number): Promise<{
        questions: ({
            level: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            sortOrder: number;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctIndex: number;
            levelId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateQuestion(id: string, dto: Partial<CreateQuestionDto>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        sortOrder: number;
        question: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        correctIndex: number;
        levelId: string | null;
    }>;
    deleteQuestion(id: string): Promise<{
        message: string;
    }>;
    bulkDeleteQuestions(ids: string[]): Promise<{
        count: number;
        message?: undefined;
    } | {
        count: number;
        message: string;
    }>;
    deleteAllQuestions(categoryId: string): Promise<{
        count: number;
        message: string;
    }>;
    purchase(userId: string, categoryId: string, dto: PurchaseDto): Promise<any>;
    getPurchased(userId: string): Promise<({
        category: {
            id: string;
            name: string;
            imageUrl: string;
        };
        level: {
            id: string;
            name: string;
        } | null;
        _count: {
            answers: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.QuizPurchaseStatus;
        userId: string;
        categoryId: string;
        paymentMethod: string;
        questionCount: number;
        levelId: string | null;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        currentIndex: number;
        purchasedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    })[]>;
    startAttempt(userId: string, purchaseId: string): Promise<{
        purchaseId: string;
        category: {
            id: string;
            name: string;
            imageUrl: string;
        };
        questionCount: number;
        questions: {
            id: string;
            question: string;
            options: string[];
        }[];
        currentIndex: number;
        startedAt: Date;
    }>;
    abandonAttempt(userId: string, purchaseId: string): Promise<{
        status: string;
        answeredCount?: undefined;
        score?: undefined;
        wrongCount?: undefined;
        skippedCount?: undefined;
        netReward?: undefined;
    } | {
        status: string;
        answeredCount: number;
        score: number;
        wrongCount: number;
        skippedCount: number;
        netReward: number;
    }>;
    submitAnswer(userId: string, purchaseId: string, dto: SubmitAnswerDto): Promise<{
        status: string;
        currentIndex: number;
        isLast: boolean;
        score?: undefined;
        wrongCount?: undefined;
        skippedCount?: undefined;
        totalQuestions?: undefined;
        netReward?: undefined;
    } | {
        status: string;
        score: number;
        wrongCount: number;
        skippedCount: number;
        totalQuestions: number;
        isLast: boolean;
        netReward: number;
        currentIndex?: undefined;
    }>;
    getNextQuestion(userId: string, purchaseId: string): Promise<{
        status: string;
        score: number;
        wrongCount: number;
        skippedCount: number;
        totalQuestions: number;
        completed: boolean;
        netReward: number;
        question?: undefined;
        currentIndex?: undefined;
        answeredCount?: undefined;
    } | {
        status: string;
        question: {
            id: string;
            question: string;
            options: string[];
        };
        currentIndex: number;
        answeredCount: number;
        totalQuestions: number;
        completed: boolean;
        score?: undefined;
        wrongCount?: undefined;
        skippedCount?: undefined;
        netReward?: undefined;
    }>;
    getResult(userId: string, purchaseId: string): Promise<{
        purchaseId: string;
        category: {
            id: string;
            name: string;
            imageUrl: string;
        };
        questionCount: number;
        score: number;
        wrongCount: number;
        skippedCount: number;
        netReward: number;
        status: import("@prisma/client").$Enums.QuizPurchaseStatus;
        startedAt: Date | null;
        completedAt: Date | null;
        answers: {
            question: string;
            options: string[];
            correctIndex: number;
            selectedIndex: number | null;
            isCorrect: boolean | null;
        }[];
    }>;
    getAdminStats(): Promise<{
        totalQuizzesSold: number;
        completedQuizzes: number;
        totalQuestionsSold: number;
        totalRevenue: number;
        totalUserRewardsPaid: number;
        netProfit: number;
        categoryStats: {
            id: string;
            name: string;
            imageUrl: string;
            totalQuestions: number;
            totalSold: number;
            totalQuestionsSold: number;
            totalRevenue: number;
        }[];
        userPurchaseLogs: {
            id: string;
            user: {
                id: string;
                email: string;
                phone: string;
                name: string;
            };
            category: {
                id: string;
                name: string;
                imageUrl: string;
            };
            questionCount: number;
            pricePaid: number;
            correctCount: number;
            wrongCount: number;
            userReward: number;
            platformProfit: number;
            status: import("@prisma/client").$Enums.QuizPurchaseStatus;
            purchasedAt: Date;
            completedAt: Date | null;
        }[];
    }>;
}
