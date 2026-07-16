import { QuizService } from './quiz.service';
import { CreateQuizDto, UpdateQuizDto, SubmitQuizDto } from './dto/quiz.dto';
export declare class QuizController {
    private readonly quizService;
    constructor(quizService: QuizService);
    adminCreate(dto: CreateQuizDto): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctIndex: number;
            quizId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        title: string;
        timeLimit: number;
    }>;
    adminFindAll(): Promise<({
        _count: {
            questions: number;
            purchases: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        title: string;
        timeLimit: number;
    })[]>;
    adminFindOne(id: string): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
            correctIndex: number;
            quizId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        title: string;
        timeLimit: number;
    }>;
    adminUpdate(id: string, dto: UpdateQuizDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        price: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        title: string;
        timeLimit: number;
    }>;
    adminDelete(id: string): Promise<{
        message: string;
    }>;
    findActive(): Promise<{
        id: string;
        price: import("@prisma/client/runtime/library").Decimal;
        title: string;
        _count: {
            questions: number;
        };
        timeLimit: number;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        price: import("@prisma/client/runtime/library").Decimal;
        title: string;
        timeLimit: number;
        questions: {
            id: string;
            question: string;
            options: import("@prisma/client/runtime/library").JsonValue;
        }[];
    }>;
    purchase(req: any, id: string, method?: string): Promise<any>;
    getPurchased(req: any): Promise<({
        quiz: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            title: string;
            _count: {
                questions: number;
            };
            timeLimit: number;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.QuizPurchaseStatus;
        userId: string;
        paymentMethod: string;
        answers: import("@prisma/client/runtime/library").JsonValue | null;
        quizId: string;
        score: number | null;
        totalQuestions: number | null;
        purchasedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    })[]>;
    startAttempt(req: any, purchaseId: string): Promise<{
        purchase: {
            quiz: {
                questions: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    sortOrder: number;
                    question: string;
                    options: import("@prisma/client/runtime/library").JsonValue;
                    correctIndex: number;
                    quizId: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                title: string;
                timeLimit: number;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.QuizPurchaseStatus;
            userId: string;
            paymentMethod: string;
            answers: import("@prisma/client/runtime/library").JsonValue | null;
            quizId: string;
            score: number | null;
            totalQuestions: number | null;
            purchasedAt: Date;
            startedAt: Date | null;
            completedAt: Date | null;
        };
        quiz: {
            title: string;
            timeLimit: number;
        };
        questions: {
            id: string;
            question: string;
            options: string[];
        }[];
        startedAt: Date;
    }>;
    submitAttempt(req: any, purchaseId: string, dto: SubmitQuizDto): Promise<{
        status: string;
        score: number;
        totalQuestions: number;
        timedOut: boolean;
    }>;
}
