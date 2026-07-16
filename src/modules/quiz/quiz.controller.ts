import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuestionDto, PurchaseDto, SubmitAnswerDto } from './dto/quiz.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Quiz')
@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    // ── Admin: Questions ─────────────────────────────────────────────────────

    @Post('admin/questions/:categoryId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Add questions to a category' })
    addQuestions(@Param('categoryId') categoryId: string, @Body() dtos: CreateQuestionDto[]) {
        return this.quizService.addQuestions(categoryId, dtos);
    }

    @Get('admin/questions/:categoryId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] List questions in a category' })
    getQuestions(
        @Param('categoryId') categoryId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.quizService.getQuestions(categoryId, Number(page) || 1, Number(limit) || 50);
    }

    @Patch('admin/questions/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Update a question' })
    updateQuestion(@Param('id') id: string, @Body() dto: Partial<CreateQuestionDto>) {
        return this.quizService.updateQuestion(id, dto);
    }

    @Delete('admin/questions/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Delete a question' })
    deleteQuestion(@Param('id') id: string) {
        return this.quizService.deleteQuestion(id);
    }

    // ── User: Category info & purchase ───────────────────────────────────────

    @Get('category/:categoryId/count')
    @ApiOperation({ summary: 'Get total question count in a category' })
    getCategoryCount(@Param('categoryId') categoryId: string) {
        return this.quizService.getQuestions(categoryId, 1, 0).then((r) => ({ total: r.total }));
    }

    @Post('purchase/:categoryId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Purchase quiz questions from a category' })
    purchase(
        @Req() req: any,
        @Param('categoryId') categoryId: string,
        @Body() dto: PurchaseDto,
    ) {
        return this.quizService.purchase(req.user.userId, categoryId, dto);
    }

    @Get('purchased')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'List user purchased quizzes' })
    getPurchased(@Req() req: any) {
        return this.quizService.getPurchased(req.user.userId);
    }

    // ── User: Attempt ────────────────────────────────────────────────────────

    @Post('attempt/:purchaseId/start')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Start/get quiz attempt' })
    startAttempt(@Req() req: any, @Param('purchaseId') purchaseId: string) {
        return this.quizService.startAttempt(req.user.userId, purchaseId);
    }

    @Post('attempt/:purchaseId/submit')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Submit answer for current question' })
    submitAnswer(
        @Req() req: any,
        @Param('purchaseId') purchaseId: string,
        @Body() dto: SubmitAnswerDto,
    ) {
        return this.quizService.submitAnswer(req.user.userId, purchaseId, dto);
    }

    @Get('attempt/:purchaseId/next')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get next unanswered question' })
    getNextQuestion(@Req() req: any, @Param('purchaseId') purchaseId: string) {
        return this.quizService.getNextQuestion(req.user.userId, purchaseId);
    }

    @Get('attempt/:purchaseId/result')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get quiz result' })
    getResult(@Req() req: any, @Param('purchaseId') purchaseId: string) {
        return this.quizService.getResult(req.user.userId, purchaseId);
    }
}
