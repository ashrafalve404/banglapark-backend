import { QuizService } from './quiz.service';
import { CreateQuestionDto, PurchaseDto, SubmitAnswerDto } from './dto/quiz.dto';
export declare class QuizController {
    private readonly quizService;
    constructor(quizService: QuizService);
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
    addQuestions(categoryId: string, dtos: CreateQuestionDto[], levelId?: string): Promise<{
        message: string;
    }>;
    getQuestions(categoryId: string, page?: string, limit?: string): Promise<{
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
            levelId: string | null;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctIndex: number;
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
        levelId: string | null;
        question: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        correctIndex: number;
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
    importCsv(categoryId: string, file: Express.Multer.File): Promise<{
        imported: number;
        errors: {
            row: number;
            message: string;
        }[];
        total: number;
    }>;
    getCategoryCount(categoryId: string): Promise<{
        total: number;
    }>;
    purchase(req: any, categoryId: string, dto: PurchaseDto): Promise<any>;
    getPurchased(req: any): Promise<({
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
        purchasedAt: Date;
        levelId: string | null;
        questionCount: number;
        totalPrice: import("@prisma/client/runtime/library").Decimal;
        currentIndex: number;
        startedAt: Date | null;
        completedAt: Date | null;
    })[]>;
    startAttempt(req: any, purchaseId: string): Promise<{
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
    submitAnswer(req: any, purchaseId: string, dto: SubmitAnswerDto): Promise<{
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
    getNextQuestion(req: any, purchaseId: string): Promise<{
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
    getResult(req: any, purchaseId: string): Promise<{
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
    abandonAttempt(req: any, purchaseId: string): Promise<{
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
}
