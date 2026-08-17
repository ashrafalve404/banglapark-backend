import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGiftCardDto, UpdateGiftCardDto, BuyGiftCardDto } from './dto/gift-cards.dto';
import { TxType, UserStatus, NotificationType } from '@prisma/client';

@Injectable()
export class GiftCardsService {
    private readonly logger = new Logger(GiftCardsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
        private readonly notificationsService: NotificationsService,
    ) { }

    private get db(): any {
        return this.prisma;
    }

    // ── Admin Methods ────────────────────────────────────────────────────────

    async adminCreateCard(dto: CreateGiftCardDto) {
        return this.db.giftCard.create({
            data: {
                title: dto.title,
                description: dto.description || '',
                price: dto.price,
                image: dto.image,
                voucherCode: dto.voucherCode,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async adminGetAllCards() {
        const cards = await this.db.giftCard.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                purchases: {
                    select: { pricePaid: true },
                },
                _count: { select: { purchases: true } },
            },
        });

        return cards.map((c: any) => {
            const totalRevenue = (c.purchases || []).reduce(
                (sum: number, p: any) => sum + Number(p.pricePaid),
                0,
            );
            const { purchases, ...rest } = c;
            return {
                ...rest,
                totalRevenue,
            };
        });
    }

    async adminGetStats() {
        const totalRevenueAgg = await this.db.giftCardPurchase.aggregate({
            _sum: { pricePaid: true },
            _count: { id: true },
        });

        const totalResaleAgg = await this.db.giftCardPurchase.aggregate({
            where: { isSold: true },
            _sum: { pricePaid: true },
            _count: { id: true },
        });

        const totalCards = await this.db.giftCard.count();
        const activeCards = await this.db.giftCard.count({ where: { isActive: true } });

        const uniqueBuyersAgg = await this.db.giftCardPurchase.groupBy({
            by: ['userId'],
        });

        const activatedAccountsCount = await this.db.giftCardPurchase.count({
            where: { wasAccountActivated: true },
        });

        return {
            totalRevenue: Number(totalRevenueAgg._sum.pricePaid ?? 0),
            totalPurchases: totalRevenueAgg._count.id ?? 0,
            totalResalePayout: Number(totalResaleAgg._sum.pricePaid ?? 0),
            totalCardsSold: totalResaleAgg._count.id ?? 0,
            totalCards,
            activeCards,
            uniqueBuyers: uniqueBuyersAgg.length,
            activatedAccountsCount,
        };
    }

    async adminGetPurchases() {
        const purchases = await this.db.giftCardPurchase.findMany({
            orderBy: { purchasedAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
                giftCard: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                    },
                },
            },
        });

        return purchases.map((p: any) => ({
            id: p.id,
            purchasedAt: p.purchasedAt,
            pricePaid: Number(p.pricePaid),
            paymentMethod: p.paymentMethod,
            userBkashNumber: p.userBkashNumber,
            bkashTrxId: p.bkashTrxId,
            voucherCode: p.voucherCode,
            wasAccountActivated: p.wasAccountActivated,
            status: p.status,
            canSellAt: p.canSellAt,
            isSold: p.isSold,
            soldAt: p.soldAt,
            user: {
                id: p.user?.id || '',
                fullName: p.user?.name || 'User',
                phone: p.user?.phone || 'N/A',
                email: p.user?.email || 'N/A',
            },
            giftCard: {
                id: p.giftCard?.id || '',
                title: p.giftCard?.title || 'Gift Card',
                price: Number(p.giftCard?.price ?? 0),
            },
        }));
    }

    async adminUpdateCard(id: string, dto: UpdateGiftCardDto) {
        const card = await this.db.giftCard.findUnique({ where: { id } });
        if (!card) throw new NotFoundException('Gift Card not found');

        return this.db.giftCard.update({
            where: { id },
            data: { ...dto },
        });
    }

    async adminDeleteCard(id: string) {
        const card = await this.db.giftCard.findUnique({ where: { id } });
        if (!card) throw new NotFoundException('Gift Card not found');

        await this.db.giftCard.delete({ where: { id } });
        return { message: 'Gift Card deleted successfully' };
    }

    // ── User Methods ─────────────────────────────────────────────────────────

    async userGetPublicCards(userId?: string) {
        const cards = await this.db.giftCard.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        let purchasedCardIds = new Set<string>();
        if (userId) {
            const myPurchases = await this.db.giftCardPurchase.findMany({
                where: { userId },
                select: { giftCardId: true },
            });
            purchasedCardIds = new Set(myPurchases.map((p: any) => p.giftCardId));
        }

        // Hide secret voucherCode until purchased!
        return cards.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            price: Number(c.price),
            image: c.image,
            isActive: c.isActive,
            isPurchased: purchasedCardIds.has(c.id),
            createdAt: c.createdAt,
        }));
    }

    async userBuyCard(userId: string, cardId: string, dto?: BuyGiftCardDto) {
        const card = await this.db.giftCard.findUnique({
            where: { id: cardId, isActive: true },
        });
        if (!card) throw new NotFoundException('Gift Card not found or inactive');

        const paymentMethod = dto?.paymentMethod || 'WALLET';
        if (paymentMethod !== 'WALLET' && paymentMethod !== 'BKASH') {
            throw new BadRequestException('Invalid payment method. Gift Cards can only be purchased using Wallet or bKash (no cash payment).');
        }

        const price = Number(card.price);

        if (paymentMethod === 'WALLET') {
            const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
            if (!wallet) throw new NotFoundException('Wallet not found');

            if (Number(wallet.balance) < price) {
                throw new BadRequestException('Insufficient wallet balance to purchase this Gift Card');
            }
        }

        const txType = (TxType as any).GIFT_CARD_PURCHASE ?? TxType.PURCHASE;
        const isActivationQualifying = price >= 2000;
        const now = new Date();
        const canSellAt = new Date(now.getTime() + 30 * 86_400_000); // 30 days from now

        const purchaseResult = await this.prisma.$transaction(async (tx: any) => {
            // 1. Debit wallet if WALLET payment method
            if (paymentMethod === 'WALLET' && price > 0) {
                const wallet = await tx.wallet.findUnique({ where: { userId } });
                await this.walletService.debit(
                    tx,
                    wallet.id,
                    price,
                    txType,
                    `Gift Card purchase: ${card.title}`,
                    cardId,
                );
            }

            // 2. Activate Account if Gift Card price >= 2000 BDT
            let wasAccountActivated = false;
            if (isActivationQualifying) {
                const activeUntil = new Date(now.getTime() + 30 * 86_400_000); // 30 days

                await tx.user.update({
                    where: { id: userId },
                    data: {
                        status: UserStatus.ACTIVE,
                        activeFrom: now,
                        activeUntil: activeUntil,
                        isFirstActivated: true,
                    },
                });

                wasAccountActivated = true;
                this.logger.log(`User ${userId} automatically ACTIVATED via Gift Card purchase of ${price} BDT until ${activeUntil.toISOString()}`);
            }

            // 3. Record Gift Card Purchase
            const purchase = await tx.giftCardPurchase.create({
                data: {
                    userId,
                    giftCardId: cardId,
                    pricePaid: price,
                    paymentMethod,
                    userBkashNumber: dto?.userBkashNumber || null,
                    bkashTrxId: dto?.bkashTrxId || null,
                    voucherCode: card.voucherCode || `GIFT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    wasAccountActivated,
                    status: 'PURCHASED',
                    canSellAt,
                    isSold: false,
                },
                include: {
                    giftCard: true,
                },
            });

            return purchase;
        });

        // Send Important Notifications
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, phone: true },
            });
            const userName = user?.name || 'User';

            // User Notification
            await this.notificationsService.create(
                userId,
                NotificationType.SYSTEM,
                'Gift Card Purchased',
                `You have purchased "${card.title}" for ৳${price}. You can use your voucher code or sell this Gift Card back to your wallet after 30 days!`,
            );

            // Admin Notification
            await this.notificationsService.notifyAdmins(
                NotificationType.SYSTEM,
                'New Gift Card Purchase',
                `User ${userName} purchased "${card.title}" for ৳${price} via ${paymentMethod}.`,
            );
        } catch (err) {
            this.logger.error(`Failed to send Gift Card purchase notifications: ${err.message}`);
        }

        return {
            message: isActivationQualifying
                ? 'Gift Card purchased successfully! Your account has been ACTIVATED for 30 days.'
                : 'Gift Card purchased successfully! It will be eligible to sell back to your wallet after 30 days.',
            wasAccountActivated: purchaseResult.wasAccountActivated,
            purchase: {
                id: purchaseResult.id,
                cardId: purchaseResult.giftCardId,
                title: purchaseResult.giftCard.title,
                description: purchaseResult.giftCard.description,
                image: purchaseResult.giftCard.image,
                pricePaid: Number(purchaseResult.pricePaid),
                paymentMethod: purchaseResult.paymentMethod,
                voucherCode: purchaseResult.voucherCode,
                status: purchaseResult.status,
                canSellAt: purchaseResult.canSellAt,
                isSold: purchaseResult.isSold,
                purchasedAt: purchaseResult.purchasedAt,
            },
        };
    }

    async userSellCard(userId: string, purchaseId: string) {
        const purchase = await this.db.giftCardPurchase.findFirst({
            where: { id: purchaseId, userId },
            include: { giftCard: true },
        });

        if (!purchase) {
            throw new NotFoundException('Purchased Gift Card record not found');
        }

        if (purchase.isSold || purchase.status === 'SOLD') {
            throw new BadRequestException('This Gift Card has already been sold and refunded');
        }

        const now = new Date();
        if (purchase.canSellAt && now < new Date(purchase.canSellAt)) {
            const daysLeft = Math.ceil((new Date(purchase.canSellAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            throw new BadRequestException(`This Gift Card can only be sold after 30 days from purchase. Please wait ${daysLeft} more day(s).`);
        }

        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found');

        const pricePaid = Number(purchase.pricePaid);
        const cardTitle = purchase.giftCard?.title || 'Gift Card';

        // Perform Wallet Credit & Record Resale inside Transaction
        const updatedPurchase = await this.prisma.$transaction(async (tx: any) => {
            // 1. Credit User Wallet
            await this.walletService.credit(
                tx,
                wallet.id,
                pricePaid,
                TxType.REFUND,
                `Gift Card resale refund: ${cardTitle}`,
                purchaseId,
            );

            // 2. Mark Purchase as SOLD
            return tx.giftCardPurchase.update({
                where: { id: purchaseId },
                data: {
                    isSold: true,
                    status: 'SOLD',
                    soldAt: now,
                },
            });
        });

        // Send Important Resale Notifications
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { name: true },
            });
            const userName = user?.name || 'User';

            // User Notification
            await this.notificationsService.create(
                userId,
                NotificationType.SYSTEM,
                'Gift Card Sold Successfully',
                `Your Gift Card "${cardTitle}" was resold and ৳${pricePaid} has been credited to your Wallet balance.`,
            );

            // Admin Notification
            await this.notificationsService.notifyAdmins(
                NotificationType.SYSTEM,
                'Gift Card Resold',
                `User ${userName} resold Gift Card "${cardTitle}" for ৳${pricePaid} back into their wallet balance.`,
            );
        } catch (err) {
            this.logger.error(`Failed to send Gift Card resale notifications: ${err.message}`);
        }

        return {
            message: `Gift Card resold successfully! ৳${pricePaid} has been credited to your Wallet.`,
            purchase: {
                id: updatedPurchase.id,
                cardId: updatedPurchase.giftCardId,
                title: cardTitle,
                pricePaid,
                status: updatedPurchase.status,
                isSold: updatedPurchase.isSold,
                soldAt: updatedPurchase.soldAt,
            },
        };
    }

    async userGetMyCards(userId: string) {
        const purchases = await this.db.giftCardPurchase.findMany({
            where: { userId },
            include: {
                giftCard: true,
            },
            orderBy: { purchasedAt: 'desc' },
        });

        return purchases.map((p: any) => ({
            id: p.id,
            cardId: p.giftCardId,
            title: p.giftCard?.title || 'Gift Card',
            description: p.giftCard?.description || '',
            image: p.giftCard?.image || null,
            pricePaid: Number(p.pricePaid),
            paymentMethod: p.paymentMethod,
            voucherCode: p.voucherCode || 'N/A',
            wasAccountActivated: p.wasAccountActivated,
            status: p.status,
            canSellAt: p.canSellAt,
            isSold: p.isSold,
            soldAt: p.soldAt,
            purchasedAt: p.purchasedAt,
        }));
    }
}
