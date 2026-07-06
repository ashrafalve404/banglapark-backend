import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { Prisma } from '@prisma/client';
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toSlug;
    create(dto: CreateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
    }>;
    findAll(query: ProductQueryDto): Promise<{
        products: ({
            category: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            price: Prisma.Decimal;
            stock: number;
            categoryId: string | null;
            images: string[];
            sizes: string[];
            isActive: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(idOrSlug: string): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
    }>;
    update(id: string, dto: UpdateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        stock: number;
        categoryId: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
    }>;
}
