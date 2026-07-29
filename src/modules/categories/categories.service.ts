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
        const data: any = {
            name: dto.name,
            slug,
            image: dto.image ?? null,
            sortOrder: dto.sortOrder ?? 0,
            isHidden: dto.isHidden ?? false,
        };
        return this.prisma.category.create({ data });
    }

    async findAll(includeHidden = false) {
        const orderBy: any = [{ sortOrder: 'asc' }, { name: 'asc' }];
        return this.prisma.category.findMany({
            where: includeHidden ? {} : { isHidden: false },
            include: { _count: { select: { products: true } } },
            orderBy,
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
        const dataToUpdate: any = {
            ...dto,
            ...(dto.name && !dto.slug && { slug: this.toSlug(dto.name) }),
        };
        if (dto.image === '' || dto.image === null) {
            dataToUpdate.image = null;
        }
        return this.prisma.category.update({
            where: { id },
            data: dataToUpdate,
        });
    }

    async toggleVisibility(id: string) {
        const cat = await this.findOne(id);
        return this.prisma.category.update({
            where: { id },
            data: { isHidden: !cat.isHidden },
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
