import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    private toSlug(name: string) {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    async create(dto: CreateCategoryDto) {
        const slug = dto.slug ?? this.toSlug(dto.name);
        const existing = await this.prisma.category.findUnique({ where: { slug } });
        if (existing) throw new ConflictException('Category with this slug already exists');
        return this.prisma.category.create({ data: { name: dto.name, slug } });
    }

    async findAll() {
        return this.prisma.category.findMany({
            include: { _count: { select: { products: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const cat = await this.prisma.category.findUnique({
            where: { id },
            include: { products: true },
        });
        if (!cat) throw new NotFoundException('Category not found');
        return cat;
    }

    async update(id: string, dto: UpdateCategoryDto) {
        await this.findOne(id);
        return this.prisma.category.update({
            where: { id },
            data: { ...dto, ...(dto.name && !dto.slug && { slug: this.toSlug(dto.name) }) },
        });
    }

    async remove(id: string) {
        const cat = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!cat) throw new NotFoundException('Category not found');

        await this.prisma.product.updateMany({
            where: { categoryId: id },
            data: { categoryId: null },
        });

        return this.prisma.category.delete({ where: { id } });
    }
}
