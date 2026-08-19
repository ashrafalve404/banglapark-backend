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
            sortOrder: number;
            image: string | null;
            isHidden: boolean;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        costPrice: Prisma.Decimal | null;
        stock: number;
        categoryId: string | null;
        sellerId: string | null;
        approvalStatus: import("@prisma/client").$Enums.ProductApprovalStatus;
        rejectionReason: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
    }>;
    findAll(query: ProductQueryDto): Promise<{
        products: ({
            category: {
                id: string;
                name: string;
            } | null;
            seller: {
                id: string;
                email: string;
                phone: string;
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
            costPrice: Prisma.Decimal | null;
            stock: number;
            categoryId: string | null;
            sellerId: string | null;
            approvalStatus: import("@prisma/client").$Enums.ProductApprovalStatus;
            rejectionReason: string | null;
            images: string[];
            sizes: string[];
            isActive: boolean;
            clicks: number;
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
            sortOrder: number;
            image: string | null;
            isHidden: boolean;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        costPrice: Prisma.Decimal | null;
        stock: number;
        categoryId: string | null;
        sellerId: string | null;
        approvalStatus: import("@prisma/client").$Enums.ProductApprovalStatus;
        rejectionReason: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
    }>;
    recordClick(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        costPrice: Prisma.Decimal | null;
        stock: number;
        categoryId: string | null;
        sellerId: string | null;
        approvalStatus: import("@prisma/client").$Enums.ProductApprovalStatus;
        rejectionReason: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
    }>;
    update(id: string, dto: UpdateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            sortOrder: number;
            image: string | null;
            isHidden: boolean;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        costPrice: Prisma.Decimal | null;
        stock: number;
        categoryId: string | null;
        sellerId: string | null;
        approvalStatus: import("@prisma/client").$Enums.ProductApprovalStatus;
        rejectionReason: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
    }>;
    updateApproval(id: string, dto: {
        approvalStatus: 'APPROVED' | 'REJECTED';
        rejectionReason?: string;
    }): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            sortOrder: number;
            image: string | null;
            isHidden: boolean;
        } | null;
        seller: {
            id: string;
            memberId: number | null;
            email: string;
            phone: string;
            referralCode: string;
            name: string;
            passwordHash: string;
            profileImage: string | null;
            role: import("@prisma/client").$Enums.Role;
            referralLink: string | null;
            parentId: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            activeFrom: Date | null;
            activeUntil: Date | null;
            isFirstActivated: boolean;
            isBanned: boolean;
            isEmailVerified: boolean;
            emailVerificationOtp: string | null;
            emailVerificationExpires: Date | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        costPrice: Prisma.Decimal | null;
        stock: number;
        categoryId: string | null;
        sellerId: string | null;
        approvalStatus: import("@prisma/client").$Enums.ProductApprovalStatus;
        rejectionReason: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        description: string | null;
        price: Prisma.Decimal;
        costPrice: Prisma.Decimal | null;
        stock: number;
        categoryId: string | null;
        sellerId: string | null;
        approvalStatus: import("@prisma/client").$Enums.ProductApprovalStatus;
        rejectionReason: string | null;
        images: string[];
        sizes: string[];
        isActive: boolean;
        clicks: number;
    }>;
    bulkRemove(ids: string[]): Promise<{
        count: number;
    }>;
}
