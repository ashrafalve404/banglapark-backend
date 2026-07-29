import { UserProductsService } from './user-products.service';
import { CreateUserProductDto } from './dto/user-product.dto';
export declare class UserProductsController {
    private readonly userProductsService;
    constructor(userProductsService: UserProductsService);
    createProduct(userId: string, dto: CreateUserProductDto): Promise<{
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
    getMyProducts(userId: string): Promise<{
        totalSoldQuantity: number;
        totalRevenue: number;
        sellerEarnings80Percent: number;
        category: {
            id: string;
            name: string;
        } | null;
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
    }[]>;
}
