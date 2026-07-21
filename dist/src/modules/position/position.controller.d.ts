import { PositionService } from './position.service';
export declare class PositionController {
    private readonly positionService;
    constructor(positionService: PositionService);
    getMyPosition(userId: string): Promise<{
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
    getPositionList(): {
        positions: import("./position.service").PositionDef[];
    };
    adminListMembers(page?: number, limit?: number, search?: string): Promise<{
        users: {
            activeTeamCount: number;
            currentPosition: import("./position.service").PositionDef | null;
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
    adminPayUser(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    adminDistribute(): Promise<{
        success: boolean;
        message: string;
    }>;
}
