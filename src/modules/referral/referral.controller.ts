import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Referral')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('referral')
export class ReferralController {
    constructor(private readonly referralService: ReferralService) { }

    @Get('my')
    @ApiOperation({ summary: 'Get my referral code and shareable link' })
    getMyReferral(@CurrentUser('id') userId: string) {
        return this.referralService.getMyReferralInfo(userId);
    }

    @Get('team/stats')
    @ApiOperation({ summary: 'Get team stats: direct, active, inactive, total counts' })
    getTeamStats(@CurrentUser('id') userId: string) {
        return this.referralService.getTeamStats(userId);
    }

    @Get('team/direct')
    @ApiOperation({ summary: 'List direct referrals (paginated)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    getDirectReferrals(
        @CurrentUser('id') userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.referralService.getDirectReferrals(userId, +page, +limit);
    }
}
