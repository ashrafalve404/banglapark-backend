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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toSlug(name) {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    async create(dto) {
        const slug = dto.slug ?? this.toSlug(dto.name);
        const existing = await this.prisma.category.findUnique({ where: { slug } });
        if (existing)
            throw new common_1.ConflictException('Category with this slug already exists');
        return this.prisma.category.create({ data: { name: dto.name, slug } });
    }
    async findAll() {
        return this.prisma.category.findMany({
            include: { _count: { select: { products: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        const cat = await this.prisma.category.findUnique({
            where: { id },
            include: { products: true },
        });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        return cat;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.category.update({
            where: { id },
            data: { ...dto, ...(dto.name && !dto.slug && { slug: this.toSlug(dto.name) }) },
        });
    }
    async remove(id) {
        const cat = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        await this.prisma.product.updateMany({
            where: { categoryId: id },
            data: { categoryId: null },
        });
        return this.prisma.category.delete({ where: { id } });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map