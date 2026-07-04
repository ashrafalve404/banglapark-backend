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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toSlug(name) {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    }
    async create(dto) {
        return this.prisma.product.create({
            data: {
                name: dto.name,
                slug: this.toSlug(dto.name),
                description: dto.description,
                price: dto.price,
                stock: dto.stock,
                categoryId: dto.categoryId,
                images: dto.images ?? [],
                sizes: dto.sizes ?? [],
            },
            include: { category: true },
        });
    }
    async findAll(query) {
        const { search, categoryId, page = 1, limit = 20, sort = 'newest' } = query;
        const skip = (page - 1) * limit;
        const where = {
            isActive: true,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(categoryId && { categoryId }),
        };
        let orderBy = [{ createdAt: 'desc' }];
        if (sort === 'price_asc')
            orderBy = [{ price: 'asc' }];
        else if (sort === 'price_desc')
            orderBy = [{ price: 'desc' }];
        else
            orderBy = [{ createdAt: 'desc' }];
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: { category: { select: { id: true, name: true } } },
                orderBy,
            }),
            this.prisma.product.count({ where }),
        ]);
        return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(idOrSlug) {
        const product = await this.prisma.product.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug },
                ],
            },
            include: { category: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.product.update({ where: { id }, data: dto, include: { category: true } });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.product.update({ where: { id }, data: { isActive: false } });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map