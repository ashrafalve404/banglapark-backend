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
            slug: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        stock: number;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string | null;
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
            slug: string;
            description: string | null;
            price: Prisma.Decimal;
            stock: number;
            images: string[];
            sizes: string[];
            isActive: boolean;
            clicks: number;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string | null;
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
            slug: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        stock: number;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string | null;
    }>;
    recordClick(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        stock: number;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string | null;
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
        price: Prisma.Decimal;
        stock: number;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        stock: number;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string | null;
    }>;
}
