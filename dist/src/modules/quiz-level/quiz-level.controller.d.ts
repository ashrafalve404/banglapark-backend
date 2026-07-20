import { QuizLevelService } from './quiz-level.service';
import { CreateQuizLevelDto, UpdateQuizLevelDto } from './dto/quiz-level.dto';
export declare class QuizLevelController {
    private readonly service;
    constructor(service: QuizLevelService);
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
