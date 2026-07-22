import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Public')
@Controller('public')
export class PublicStatsController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Public platform stats (user count)' })
    async getStats() {
        const totalUsers = await this.prisma.user.count({ where: { role: 'USER' } });
        return { totalUsers };
    }
}
