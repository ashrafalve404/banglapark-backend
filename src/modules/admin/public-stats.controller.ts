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

    @Get('new-members')
    @ApiOperation({ summary: 'Last 8 newly registered members (public)' })
    async getNewMembers() {
        const members = await this.prisma.user.findMany({
            where: { role: 'USER' },
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: { id: true, name: true, profileImage: true, createdAt: true },
        });
        return members;
    }
}

