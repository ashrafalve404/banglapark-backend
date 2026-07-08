import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(query: ProductQueryDto): Promise<{
        products: ({
            category: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            stock: number;
            categoryId: string | null;
            images: string[];
            sizes: string[];
            isActive: boolean;
            clicks: number;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    recordClick(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
