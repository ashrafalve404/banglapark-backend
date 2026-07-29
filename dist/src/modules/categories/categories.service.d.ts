import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toSlug;
    create(dto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        sortOrder: number;
        image: string | null;
        isHidden: boolean;
    }>;
    findAll(includeHidden?: boolean): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        sortOrder: number;
        image: string | null;
        isHidden: boolean;
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
            sellerId: string | null;
            approvalStatus: import("@prisma/client").$Enums.ProductApprovalStatus;
            rejectionReason: string | null;
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
        sortOrder: number;
        image: string | null;
        isHidden: boolean;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        sortOrder: number;
        image: string | null;
        isHidden: boolean;
    }>;
    toggleVisibility(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        sortOrder: number;
        image: string | null;
        isHidden: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        sortOrder: number;
        image: string | null;
        isHidden: boolean;
    }>;
}
