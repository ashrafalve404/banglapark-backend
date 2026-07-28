import { PrismaService } from '../../prisma/prisma.service';
export declare class PublicStatsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalUsers: number;
    }>;
    getNewMembers(): Promise<{
        id: string;
        name: string;
        profileImage: string | null;
        createdAt: Date;
    }[]>;
    getTopLeaders(): Promise<{
        id: string;
        name: string;
        profileImage: string | null;
        teamCount: number;
    }[]>;
}
