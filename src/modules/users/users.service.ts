import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    private selectSafeUser = {
        id: true,
        memberId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        activeFrom: true,
        activeUntil: true,
        isFirstActivated: true,
        referralCode: true,
        referralLink: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
    };

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: this.selectSafeUser,
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async getProfile(id: string) {
        const user = await this.findById(id);
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: id },
            select: { balance: true, pendingWithdrawal: true },
        });
        const daysLeft = user.activeUntil
            ? Math.max(
                0,
                Math.ceil(
                    (new Date(user.activeUntil).getTime() - Date.now()) / 86_400_000,
                ),
            )
            : null;

        let usedReferralCode: string | null = null;
        if (user.parentId) {
            const p = await this.prisma.user.findUnique({
                where: { id: user.parentId },
                select: { referralCode: true },
            });
            usedReferralCode = p?.referralCode || null;
        }

        return { ...user, usedReferralCode, wallet, activeDaysRemaining: daysLeft };
    }

    async updateProfile(id: string, dto: UpdateProfileDto) {
        const data: Record<string, unknown> = {};
        if (dto.name) data.name = dto.name;
        if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);

        const updated = await this.prisma.user.update({
            where: { id },
            data,
            select: this.selectSafeUser,
        });

        let usedReferralCode: string | null = null;
        if (updated.parentId) {
            const p = await this.prisma.user.findUnique({
                where: { id: updated.parentId },
                select: { referralCode: true },
            });
            usedReferralCode = p?.referralCode || null;
        }

        return { ...updated, usedReferralCode };
    }

    async getStatement(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                ...this.selectSafeUser,
                parentId: true,
                isBanned: true,
            },
        });
        if (!user) throw new NotFoundException('User not found');

        let usedReferralCode: string | null = null;
        if (user.parentId) {
            const p = await this.prisma.user.findUnique({
                where: { id: user.parentId },
                select: { referralCode: true },
            });
            usedReferralCode = p?.referralCode || null;
        }

        const [wallet, transactions, withdrawals, teamCount, orderAgg] = await Promise.all([
            this.prisma.wallet.findUnique({
                where: { userId: id },
                select: { balance: true, pendingWithdrawal: true },
            }),
            this.prisma.walletTransaction.findMany({
                where: { wallet: { userId: id } },
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: {
                    id: true,
                    type: true,
                    amount: true,
                    balanceAfter: true,
                    description: true,
                    benefitCategory: true,
                    createdAt: true,
                },
            }),
            this.prisma.withdrawalRequest.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: {
                    id: true,
                    amount: true,
                    method: true,
                    accountDetails: true,
                    status: true,
                    createdAt: true,
                    reviewedAt: true,
                },
            }),
            this.prisma.user.count({ where: { parentId: id } }),
            this.prisma.order.aggregate({
                where: { userId: id },
                _count: { id: true },
                _sum: { total: true },
            }),
        ]);

        const dailyReward = transactions
            .filter((t) => t.type === 'DAILY_BENEFIT' && t.benefitCategory === 'BASE')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const tierBonus = transactions
            .filter((t) => t.type === 'DAILY_BENEFIT' && t.benefitCategory === 'TIER')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const generationIncome = transactions
            .filter((t) => t.type === 'GENERATION_COMMISSION')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const { parentId, ...safeUser } = user;

        return {
            account: {
                ...safeUser,
                usedReferralCode,
                walletBalance: wallet ? Number(wallet.balance) : 0,
                pendingWithdrawal: wallet ? Number(wallet.pendingWithdrawal) : 0,
                dailyReward,
                tierBonus,
                generationIncome,
                withdrawable: wallet
                    ? Math.max(0, Number(wallet.balance) - Number(wallet.pendingWithdrawal))
                    : 0,
            },
            transactions,
            withdrawals,
            team: {
                totalTeam: teamCount,
            },
            orders: {
                totalOrders: orderAgg._count.id,
                totalSpent: orderAgg._sum.total ? Number(orderAgg._sum.total) : 0,
            },
        };
    }

    async getActivationStatus(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { status: true, activeUntil: true, isFirstActivated: true },
        });
        if (!user) throw new NotFoundException('User not found');

        const now = new Date();
        const isExpired = user.activeUntil ? user.activeUntil < now : true;
        const daysLeft = user.activeUntil
            ? Math.max(0, Math.ceil((user.activeUntil.getTime() - now.getTime()) / 86_400_000))
            : 0;

        return {
            status: user.status,
            activeUntil: user.activeUntil,
            isFirstActivated: user.isFirstActivated,
            isExpired,
            daysLeft,
        };
    }

    // ── Admin-only ────────────────────────────────────────────────────────────
    async findAll(page = 1, limit = 20, search?: string) {
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                    { phone: { contains: search } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: this.selectSafeUser,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async setUserBan(id: string, isBanned: boolean) {
        return this.prisma.user.update({
            where: { id },
            data: { isBanned },
            select: { id: true, name: true, isBanned: true },
        });
    }
}
