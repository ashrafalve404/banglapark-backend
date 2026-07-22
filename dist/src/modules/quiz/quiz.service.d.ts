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
    submitAnswer(userId: string, purchaseId: string, dto: SubmitAnswerDto): Promise<{
        status: string;
        score: number;
        totalQuestions: number;
        isLast: boolean;
        netReward: number;
        currentIndex?: undefined;
    } | {
        status: string;
        currentIndex: number;
        isLast: boolean;
        score?: undefined;
        totalQuestions?: undefined;
        netReward?: undefined;
    }>;
    getNextQuestion(userId: string, purchaseId: string): Promise<{
        status: "COMPLETED";
        score: number;
        totalQuestions: number;
        completed: boolean;
        netReward: number;
        question?: undefined;
        currentIndex?: undefined;
        answeredCount?: undefined;
    } | {
        status: string;
        score: number;
        totalQuestions: number;
        completed: boolean;
        netReward?: undefined;
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
        totalQuestions: number;
        answeredCount: number;
        completed: boolean;
        score?: undefined;
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
}
