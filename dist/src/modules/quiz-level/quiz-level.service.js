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
exports.QuizLevelService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let QuizLevelService = class QuizLevelService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByCategory(categoryId) {
        return this.prisma.quizLevel.findMany({
            where: { categoryId },
            include: { _count: { select: { questions: true } } },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async create(categoryId, dto) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id: categoryId } });
        if (!cat)
            throw new common_1.NotFoundException('Quiz category not found');
        return this.prisma.quizLevel.create({
            data: { categoryId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
        });
    }
    async update(id, dto) {
        const level = await this.prisma.quizLevel.findUnique({ where: { id } });
        if (!level)
            throw new common_1.NotFoundException('Quiz level not found');
        return this.prisma.quizLevel.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const level = await this.prisma.quizLevel.findUnique({ where: { id } });
        if (!level)
            throw new common_1.NotFoundException('Quiz level not found');
        await this.prisma.quizLevel.delete({ where: { id } });
        return { message: 'Quiz level deleted' };
    }
};
exports.QuizLevelService = QuizLevelService;
exports.QuizLevelService = QuizLevelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuizLevelService);
//# sourceMappingURL=quiz-level.service.js.map