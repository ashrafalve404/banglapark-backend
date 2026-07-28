import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserProductDto } from './dto/user-product.dto';
import { ProductApprovalStatus } from '@prisma/client';

@Injectable()
export class UserProductsService {
    constructor(private readonly prisma: PrismaService) { }

    private toSlug(name: string) {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    }

    async createProduct(userId: string, dto: CreateUserProductDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { status: true },
        });

        if (!user || user.status !== 'ACTIVE') {
            throw new ForbiddenException('Only active members can list products for sale.');
        }

        return this.prisma.product.create({
            data: {
                name: dto.name,
                slug: this.toSlug(dto.name),
                description: dto.description,
                price: dto.price,
                stock: dto.stock ?? 1,
                categoryId: dto.categoryId || null,
                sellerId: userId,
                approvalStatus: ProductApprovalStatus.PENDING,
                isActive: false, // Requires admin approval before live in shop
                images: dto.images ?? [],
                sizes: dto.sizes ?? [],
            },
            include: { category: true },
        });
    }

    async getMyProducts(userId: string) {
        const products = await this.prisma.product.findMany({
            where: { sellerId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                category: { select: { id: true, name: true } },
                orderItems: {
                    where: { order: { status: 'DELIVERED' } },
                    select: { quantity: true, price: true },
                },
            },
        });

        return products.map((p) => {
            const deliveredItems = p.orderItems;
            const totalSoldQuantity = deliveredItems.reduce((acc, item) => acc + item.quantity, 0);
            const totalRevenue = deliveredItems.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
            const sellerEarnings80Percent = totalRevenue * 0.80;

            const { orderItems, ...rest } = p;
            return {
                ...rest,
                totalSoldQuantity,
                totalRevenue,
                sellerEarnings80Percent,
            };
        });
    }
}
