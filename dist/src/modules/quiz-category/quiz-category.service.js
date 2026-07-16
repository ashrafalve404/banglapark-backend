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
exports.QuizCategoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let QuizCategoryService = class QuizCategoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.quizCategory.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { questions: true } } },
        });
    }
    async findActive() {
        return this.prisma.quizCategory.findMany({
            where: { isActive: true },
            include: { _count: { select: { questions: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const cat = await this.prisma.quizCategory.findUnique({
            where: { id },
            include: { _count: { select: { questions: true } } },
        });
        if (!cat)
            throw new common_1.NotFoundException('Quiz category not found');
        return cat;
    }
    async create(dto) {
        return this.prisma.quizCategory.create({ data: dto });
    }
    async update(id, dto) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id } });
        if (!cat)
            throw new common_1.NotFoundException('Quiz category not found');
        return this.prisma.quizCategory.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id } });
        if (!cat)
            throw new common_1.NotFoundException('Quiz category not found');
        await this.prisma.quizCategory.delete({ where: { id } });
        return { message: 'Quiz category deleted' };
    }
};
exports.QuizCategoryService = QuizCategoryService;
exports.QuizCategoryService = QuizCategoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuizCategoryService);
//# sourceMappingURL=quiz-category.service.js.map