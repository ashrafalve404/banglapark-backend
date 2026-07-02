import { WithdrawMethod } from '@prisma/client';
export declare class CreateWithdrawalDto {
    amount: number;
    method: WithdrawMethod;
    accountDetails: Record<string, string>;
}
export declare class ReviewWithdrawalDto {
    status: 'APPROVED' | 'REJECTED';
    reason?: string;
}
