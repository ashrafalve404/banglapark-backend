import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuizCategoryDto, UpdateQuizCategoryDto } from './dto/quiz-category.dto';

@Injectable()
export class QuizCategoryService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        return this.prisma.quizCategory.findMany({
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            include: {
                _count: { select: { questions: true } },
                levels: { include: { _count: { select: { questions: true } } }, orderBy: { sortOrder: 'asc' } },
            },
        });
    }

    async findActive() {
        return this.prisma.quizCategory.findMany({
            where: { isActive: true },
            include: {
                _count: { select: { questions: true } },
                levels: { include: { _count: { select: { questions: true } } }, orderBy: { sortOrder: 'asc' } },
            },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }

    async findOne(id: string) {
        const cat = await this.prisma.quizCategory.findUnique({
            where: { id },
            include: {
                _count: { select: { questions: true } },
                levels: { include: { _count: { select: { questions: true } } }, orderBy: { sortOrder: 'asc' } },
            },
        });
        if (!cat) throw new NotFoundException('Quiz category not found');
        return cat;
    }

    async create(dto: CreateQuizCategoryDto) {
        return this.prisma.quizCategory.create({ data: dto });
    }

    async update(id: string, dto: UpdateQuizCategoryDto) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id } });
        if (!cat) throw new NotFoundException('Quiz category not found');
        return this.prisma.quizCategory.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id } });
        if (!cat) throw new NotFoundException('Quiz category not found');
        await this.prisma.quizCategory.delete({ where: { id } });
        return { message: 'Quiz category deleted' };
    }
}
