import { PrismaService } from '../../prisma/prisma.service';
export declare class PublicStatsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalUsers: number;
    }>;
}
