import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuizLevelDto, UpdateQuizLevelDto } from './dto/quiz-level.dto';

@Injectable()
export class QuizLevelService {
    constructor(private readonly prisma: PrismaService) {}

    async findByCategory(categoryId: string) {
        return this.prisma.quizLevel.findMany({
            where: { categoryId },
            include: { _count: { select: { questions: true } } },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async create(categoryId: string, dto: CreateQuizLevelDto) {
        const cat = await this.prisma.quizCategory.findUnique({ where: { id: categoryId } });
        if (!cat) throw new NotFoundException('Quiz category not found');
        return this.prisma.quizLevel.create({
            data: { categoryId, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
        });
    }

    async update(id: string, dto: UpdateQuizLevelDto) {
        const level = await this.prisma.quizLevel.findUnique({ where: { id } });
        if (!level) throw new NotFoundException('Quiz level not found');
        return this.prisma.quizLevel.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        const level = await this.prisma.quizLevel.findUnique({ where: { id } });
        if (!level) throw new NotFoundException('Quiz level not found');
        await this.prisma.quizLevel.delete({ where: { id } });
        return { message: 'Quiz level deleted' };
    }
}
