import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto, UpdateQuizDto, SubmitQuizDto } from './dto/quiz.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Quiz')
@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) { }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    @Post('admin')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Create quiz with questions' })
    adminCreate(@Body() dto: CreateQuizDto) { return this.quizService.adminCreate(dto); }

    @Get('admin')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] List all quizzes' })
    adminFindAll() { return this.quizService.adminFindAll(); }

    @Get('admin/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Get quiz details with questions' })
    adminFindOne(@Param('id') id: string) { return this.quizService.adminFindOne(id); }

    @Patch('admin/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Update quiz' })
    adminUpdate(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
        return this.quizService.adminUpdate(id, dto);
    }

    @Delete('admin/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Delete quiz' })
    adminDelete(@Param('id') id: string) { return this.quizService.adminDelete(id); }

    // ── User endpoints ────────────────────────────────────────────────────────

    @Get()
    @ApiOperation({ summary: 'List active quizzes (public)' })
    findActive() { return this.quizService.findActive(); }

    @Get(':id')
    @ApiOperation({ summary: 'Get quiz details (public)' })
    findOne(@Param('id') id: string) { return this.quizService.findOne(id); }

    @Post(':id/purchase')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Purchase a quiz' })
    purchase(
        @Req() req: any,
        @Param('id') id: string,
        @Query('method') method?: string,
    ) {
        return this.quizService.purchase(req.user.userId, id, method || 'WALLET');
    }

    @Get('user/purchased')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'List user purchased quizzes' })
    getPurchased(@Req() req: any) {
        return this.quizService.getPurchased(req.user.userId);
    }

    @Get('attempt/:purchaseId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Start/get quiz attempt questions' })
    startAttempt(@Req() req: any, @Param('purchaseId') purchaseId: string) {
        return this.quizService.startAttempt(req.user.userId, purchaseId);
    }

    @Post('attempt/:purchaseId/submit')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Submit quiz answers' })
    submitAttempt(
        @Req() req: any,
        @Param('purchaseId') purchaseId: string,
        @Body() dto: SubmitQuizDto,
    ) {
        return this.quizService.submitAttempt(req.user.userId, purchaseId, dto);
    }
}
