import {
    Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizLevelService } from './quiz-level.service';
import { CreateQuizLevelDto, UpdateQuizLevelDto } from './dto/quiz-level.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Quiz Levels')
@Controller('quiz-levels')
export class QuizLevelController {
    constructor(private readonly service: QuizLevelService) {}

    @Get(':categoryId')
    @ApiOperation({ summary: 'List levels in a category' })
    findByCategory(@Param('categoryId') categoryId: string) {
        return this.service.findByCategory(categoryId);
    }

    @Post(':categoryId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Create a level in a category' })
    create(@Param('categoryId') categoryId: string, @Body() dto: CreateQuizLevelDto) {
        return this.service.create(categoryId, dto);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Update a level' })
    update(@Param('id') id: string, @Body() dto: UpdateQuizLevelDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: '[Admin] Delete a level' })
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
