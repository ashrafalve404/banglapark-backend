import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
export interface PositionDef {
    rank: number;
    name: string;
    requiredMembers: number;
    monthlySalary: number;
}
export declare const POSITIONS: PositionDef[];
export declare class PositionService {
    private readonly prisma;
    private readonly walletService;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService);
    getActiveTeamCount(userId: string): Promise<number>;
    getUserPositionData(userId: string): Promise<{
        activeTeamCount: number;
        positions: {
            isUnlocked: boolean;
            rank: number;
            name: string;
            requiredMembers: number;
            monthlySalary: number;
        }[];
        highestUnlocked: {
            isUnlocked: boolean;
            rank: number;
            name: string;
            requiredMembers: number;
            monthlySalary: number;
        } | null;
    }>;
    adminListMembersWithPosition(page?: number, limit?: number, search?: string): Promise<{
        users: {
            activeTeamCount: number;
            currentPosition: PositionDef | null;
            id: string;
            memberId: number | null;
            email: string;
            phone: string;
            name: string;
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    distributePositionSalaries(): Promise<void>;
    payPositionSalaryForUser(userId: string, monthKey: string): Promise<void>;
}
