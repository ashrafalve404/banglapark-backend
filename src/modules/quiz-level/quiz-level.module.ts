import { Module } from '@nestjs/common';
import { QuizLevelController } from './quiz-level.controller';
import { QuizLevelService } from './quiz-level.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [QuizLevelController],
    providers: [QuizLevelService, PrismaService],
    exports: [QuizLevelService],
})
export class QuizLevelModule {}
