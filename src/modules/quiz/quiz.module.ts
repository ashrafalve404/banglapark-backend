import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { WalletService } from '../wallet/wallet.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [QuizController],
    providers: [QuizService, WalletService, PrismaService],
    exports: [QuizService],
})
export class QuizModule { }
