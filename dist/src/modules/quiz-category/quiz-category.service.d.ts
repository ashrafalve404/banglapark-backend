import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuizCategoryDto, UpdateQuizCategoryDto } from './dto/quiz-category.dto';
export declare class QuizCategoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            questions: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
    })[]>;
    findActive(): Promise<({
        _count: {
            questions: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            questions: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
    }>;
    create(dto: CreateQuizCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
    }>;
    update(id: string, dto: UpdateQuizCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
