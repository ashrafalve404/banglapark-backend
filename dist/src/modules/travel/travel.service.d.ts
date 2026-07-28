import { PrismaService } from '../../prisma/prisma.service';
export declare class TravelService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsertTier(tierNumber: number, destinations: string[], month: number, year: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        year: number;
        tierNumber: number;
        minMembers: number;
        destinations: string[];
        month: number;
    }>;
    getTiersForMonth(month: number, year: number): Promise<({
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        year: number;
        tierNumber: number;
        minMembers: number;
        destinations: string[];
        month: number;
    } | {
        id: null;
        tierNumber: number;
        minMembers: number;
        destinations: never[];
        month: number;
        year: number;
        isActive: boolean;
        createdAt: null;
        updatedAt: null;
    })[]>;
    clearTier(tierNumber: number, month: number, year: number): Promise<{
        message: string;
    }>;
    getUserEligibility(userId: string): Promise<{
        month: number;
        year: number;
        monthlyNewActiveCount: number;
        isEligible: boolean;
        unlockedTier: {
            tierNumber: number;
            minMembers: number;
            destinations: string[];
        } | null;
        allTiers: {
            tierNumber: number;
            minMembers: number;
            destinations: string[];
            achieved: boolean;
        }[];
    }>;
    getAchieversList(month: number, year: number): Promise<{
        monthlyNewActiveCount: number;
        tierNumber: number;
        id: string;
        memberId: number | null;
        email: string;
        phone: string;
        name: string;
    }[]>;
}
