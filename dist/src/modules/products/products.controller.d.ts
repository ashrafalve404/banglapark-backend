import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(query: ProductQueryDto): Promise<{
        products: ({
            category: {
                name: string;
                id: string;
            } | null;
        } & {
            name: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            stock: number;
            categoryId: string | null;
            images: string[];
            sizes: string[];
            isActive: boolean;
            id: string;
            slug: string;
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
            name: string;
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        id: string;
        slug: string;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    recordClick(id: string): Promise<{
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        id: string;
        slug: string;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateProductDto): Promise<{
        category: {
            name: string;
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        id: string;
        slug: string;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateProductDto): Promise<{
        category: {
            name: string;
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        id: string;
        slug: string;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        id: string;
        slug: string;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
