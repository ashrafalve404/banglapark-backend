import { Controller, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get my full profile with wallet + activation info' })
    getMyProfile(@CurrentUser('id') id: string) {
        return this.usersService.getProfile(id);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update my profile (name / password)' })
    updateProfile(@CurrentUser('id') id: string, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(id, dto);
    }

    @Get('me/statement')
    @ApiOperation({ summary: 'Get full account statement for PDF download' })
    getStatement(@CurrentUser('id') id: string) {
        return this.usersService.getStatement(id);
    }

    @Get('me/activation')
    @ApiOperation({ summary: 'Get activation status and days remaining' })
    getActivation(@CurrentUser('id') id: string) {
        return this.usersService.getActivationStatus(id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get any user by ID (admin use)' })
    getUser(@Param('id') id: string) {
        return this.usersService.findById(id);
    }
}
