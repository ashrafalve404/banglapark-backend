import { TravelService } from './travel.service';
export declare class TravelController {
    private readonly travelService;
    constructor(travelService: TravelService);
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
    getAchievers(month: number, year: number): Promise<{
        monthlyNewActiveCount: number;
        tierNumber: number;
        id: string;
        memberId: number | null;
        email: string;
        phone: string;
        name: string;
    }[]>;
    getAdminTiers(month: number, year: number): Promise<({
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
    upsertTier(body: {
        tierNumber: number;
        destinations: string[];
        month: number;
        year: number;
    }): Promise<{
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
    clearTier(tierNumber: number, month: number, year: number): Promise<{
        message: string;
    }>;
}
