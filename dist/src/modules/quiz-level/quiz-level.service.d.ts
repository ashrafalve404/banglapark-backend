import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuizLevelDto, UpdateQuizLevelDto } from './dto/quiz-level.dto';
export declare class QuizLevelService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByCategory(categoryId: string): Promise<({
        _count: {
            questions: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        sortOrder: number;
    })[]>;
    create(categoryId: string, dto: CreateQuizLevelDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        sortOrder: number;
    }>;
    update(id: string, dto: UpdateQuizLevelDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
