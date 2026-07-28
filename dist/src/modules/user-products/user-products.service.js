"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let UserProductsService = class UserProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toSlug(name) {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    }
    async createProduct(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { status: true },
        });
        if (!user || user.status !== 'ACTIVE') {
            throw new common_1.ForbiddenException('Only active members can list products for sale.');
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
                approvalStatus: client_1.ProductApprovalStatus.PENDING,
                isActive: false,
                images: dto.images ?? [],
                sizes: dto.sizes ?? [],
            },
            include: { category: true },
        });
    }
    async getMyProducts(userId) {
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
};
exports.UserProductsService = UserProductsService;
exports.UserProductsService = UserProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserProductsService);
//# sourceMappingURL=user-products.service.js.map