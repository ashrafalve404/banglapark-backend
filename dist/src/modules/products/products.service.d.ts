import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { Prisma } from '@prisma/client';
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toSlug;
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
        price: Prisma.Decimal;
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
    findAll(query: ProductQueryDto): Promise<{
        products: ({
            category: {
                name: string;
                id: string;
            } | null;
        } & {
            name: string;
            description: string | null;
            price: Prisma.Decimal;
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
    findOne(idOrSlug: string): Promise<{
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
        price: Prisma.Decimal;
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
        price: Prisma.Decimal;
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
        price: Prisma.Decimal;
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
        price: Prisma.Decimal;
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
