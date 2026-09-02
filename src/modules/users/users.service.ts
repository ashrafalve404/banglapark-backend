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
        profileImage: true,
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
        if (dto.profileImage !== undefined) data.profileImage = dto.profileImage;

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

        const [
            wallet,
            transactions,
            withdrawals,
            recursiveTeamResult,
            directTeamCount,
            orderAgg,
            dailyRewardAgg,
            tierBonusAgg,
            generationIncomeAgg,
        ] = await Promise.all([
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
            // Recursive CTE for total downline team members (all generations)
            this.prisma.$queryRaw<[{ total: bigint; active: bigint }]>`
                WITH RECURSIVE team AS (
                    SELECT id, status FROM "User" WHERE "parentId" = ${id}
                    UNION ALL
                    SELECT u.id, u.status FROM "User" u
                    INNER JOIN team t ON u."parentId" = t.id
                )
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active
                FROM team
            `,
            // Direct referrals count (Level 1)
            this.prisma.user.count({ where: { parentId: id } }),
            // Total orders & total spent
            this.prisma.order.aggregate({
                where: { userId: id },
                _count: { id: true },
                _sum: { total: true },
            }),
            // Lifetime Daily Base Benefit sum
            this.prisma.walletTransaction.aggregate({
                where: { wallet: { userId: id }, type: 'DAILY_BENEFIT', benefitCategory: 'BASE' },
                _sum: { amount: true },
            }),
            // Lifetime Tier / Sales Bonus sum
            this.prisma.walletTransaction.aggregate({
                where: { wallet: { userId: id }, type: 'DAILY_BENEFIT', benefitCategory: 'TIER' },
                _sum: { amount: true },
            }),
            // Lifetime Generation Commission sum
            this.prisma.walletTransaction.aggregate({
                where: { wallet: { userId: id }, type: 'GENERATION_COMMISSION' },
                _sum: { amount: true },
            }),
        ]);

        const totalTeamCount = Number(recursiveTeamResult[0]?.total ?? 0);
        const activeTeamCount = Number(recursiveTeamResult[0]?.active ?? 0);

        const dailyReward = Number(dailyRewardAgg._sum.amount ?? 0);
        const tierBonus = Number(tierBonusAgg._sum.amount ?? 0);
        const generationIncome = Number(generationIncomeAgg._sum.amount ?? 0);

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
                totalTeam: totalTeamCount,
                directTeam: directTeamCount,
                activeTeam: activeTeamCount,
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
        // Exclude only newly registered accounts with a pending unverified OTP code
        const where: any = {
            NOT: {
                AND: [
                    { isEmailVerified: false },
                    { emailVerificationOtp: { not: null } },
                ],
            },
        };

        if (search) {
            where.AND = [
                {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' as const } },
                        { email: { contains: search, mode: 'insensitive' as const } },
                        { phone: { contains: search } },
                    ],
                },
            ];
        }

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
