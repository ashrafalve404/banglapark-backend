import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    })[]>;
    findOne(id: string): Promise<{
        products: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            stock: number;
            categoryId: string | null;
            images: string[];
            sizes: string[];
            isActive: boolean;
            clicks: number;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    create(dto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
}
