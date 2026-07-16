import { Module } from '@nestjs/common';
import { QuizCategoryController } from './quiz-category.controller';
import { QuizCategoryService } from './quiz-category.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [QuizCategoryController],
    providers: [QuizCategoryService, PrismaService],
    exports: [QuizCategoryService],
})
export class QuizCategoryModule { }
