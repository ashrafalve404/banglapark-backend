import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    private toSlug(name: string) {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    }

    async create(dto: CreateProductDto) {
        return this.prisma.product.create({
            data: {
                name: dto.name,
                slug: this.toSlug(dto.name),
                description: dto.description,
                price: dto.price,
                costPrice: dto.costPrice,
                stock: dto.stock,
                categoryId: dto.categoryId,
                images: dto.images ?? [],
                sizes: dto.sizes ?? [],
            },
            include: { category: true },
        });
    }

    async findAll(query: ProductQueryDto) {
        const { search, categoryId, page = 1, limit = 20, sort = 'newest' } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = {
            ...(search
                ? {
                    OR: [
                        { id: { contains: search, mode: 'insensitive' } },
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : { isActive: true }),
            ...(categoryId && { categoryId }),
        };

        let orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ createdAt: 'desc' }];
        if (sort === 'price_asc') orderBy = [{ price: 'asc' }];
        else if (sort === 'price_desc') orderBy = [{ price: 'desc' }];
        else if (sort === 'popular') orderBy = [{ clicks: 'desc' }];
        else orderBy = [{ createdAt: 'desc' }];

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

    async findOne(idOrSlug: string) {
        const product = await this.prisma.product.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug },
                ],
            },
            include: { category: true },
        });
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }

    async recordClick(id: string) {
        return this.prisma.product.update({
            where: { id },
            data: { clicks: { increment: 1 } },
        });
    }

    async update(id: string, dto: UpdateProductDto) {
        await this.findOne(id);
        return this.prisma.product.update({ where: { id }, data: dto, include: { category: true } });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.product.update({ where: { id }, data: { isActive: false } });
    }

    async bulkRemove(ids: string[]) {
        if (!ids || ids.length === 0) return { count: 0 };
        return this.prisma.product.updateMany({
            where: { id: { in: ids } },
            data: { isActive: false },
        });
    }
}
