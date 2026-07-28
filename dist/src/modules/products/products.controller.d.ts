import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, UpdateApprovalDto } from './dto/product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
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
    }>;
    recordClick(id: string): Promise<{
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
    }>;
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
    }>;
    updateApproval(id: string, dto: UpdateApprovalDto): Promise<{
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
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
    }>;
    remove(id: string): Promise<{
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
    }>;
    bulkRemove(ids: string[]): Promise<{
        count: number;
    }>;
}
