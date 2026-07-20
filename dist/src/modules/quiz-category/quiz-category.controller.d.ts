import { QuizCategoryService } from './quiz-category.service';
import { CreateQuizCategoryDto, UpdateQuizCategoryDto } from './dto/quiz-category.dto';
export declare class QuizCategoryController {
    private readonly service;
    constructor(service: QuizCategoryService);
    findActive(): Promise<({
        levels: ({
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
        })[];
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
        sortOrder: number;
    })[]>;
    findAll(): Promise<({
        levels: ({
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
        })[];
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
        sortOrder: number;
    })[]>;
    findOne(id: string): Promise<{
        levels: ({
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
        })[];
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
        sortOrder: number;
    }>;
    create(dto: CreateQuizCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
        sortOrder: number;
    }>;
    update(id: string, dto: UpdateQuizCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
