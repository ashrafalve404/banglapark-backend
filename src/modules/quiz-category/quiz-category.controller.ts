import {
    Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizCategoryService } from './quiz-category.service';
import { CreateQuizCategoryDto, UpdateQuizCategoryDto } from './dto/quiz-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Quiz Categories')
@Controller('quiz-categories')
export class QuizCategoryController {
    constructor(private readonly service: QuizCategoryService) {}

    @Get()
    @ApiOperation({ summary: 'List active quiz categories with quiz count (public)' })
    findActive() { return this.service.findActive(); }

    @Get('all')
    @ApiOperation({ summary: 'List all quiz categories (public)' })
    findAll() { return this.service.findAll(); }

    @Get(':id')
    @ApiOperation({ summary: 'Get single quiz category' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Create quiz category' })
    create(@Body() dto: CreateQuizCategoryDto) { return this.service.create(dto); }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Update quiz category' })
    update(@Param('id') id: string, @Body() dto: UpdateQuizCategoryDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Delete quiz category' })
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
