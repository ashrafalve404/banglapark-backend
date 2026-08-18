import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGiftCardDto, UpdateGiftCardDto, BuyGiftCardDto } from './dto/gift-cards.dto';
export declare class GiftCardsService {
    private readonly prisma;
    private readonly walletService;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService, notificationsService: NotificationsService);
    private get db();
    adminCreateCard(dto: CreateGiftCardDto): Promise<any>;
    adminGetAllCards(): Promise<any>;
    adminGetStats(): Promise<{
        totalRevenue: number;
        totalPurchases: any;
        pendingApprovalsCount: any;
        totalResalePayout: number;
        totalCardsSold: any;
        totalCards: any;
        activeCards: any;
        uniqueBuyers: any;
        activatedAccountsCount: any;
    }>;
    adminGetPurchases(): Promise<any>;
    adminApprovePurchase(purchaseId: string): Promise<{
        message: string;
        purchase: any;
    }>;
    adminRejectPurchase(purchaseId: string): Promise<{
        message: string;
        purchase: any;
    }>;
    adminDeletePurchase(purchaseId: string): Promise<{
        message: string;
    }>;
    adminUpdateCard(id: string, dto: UpdateGiftCardDto): Promise<any>;
    adminDeleteCard(id: string): Promise<{
        message: string;
    }>;
    userGetPublicCards(userId?: string): Promise<any>;
    userBuyCard(userId: string, cardId: string, dto?: BuyGiftCardDto): Promise<{
        message: string;
        wasAccountActivated: any;
        purchase: {
            id: any;
            cardId: any;
            title: any;
            description: any;
            image: any;
            pricePaid: number;
            paymentMethod: any;
            voucherCode: any;
            status: any;
            canSellAt: any;
            isSold: any;
            purchasedAt: any;
        };
    }>;
    userSellCard(userId: string, purchaseId: string): Promise<{
        message: string;
        purchase: {
            id: any;
            cardId: any;
            title: any;
            pricePaid: number;
            status: any;
            isSold: any;
            soldAt: any;
        };
    }>;
    userGetMyCards(userId: string): Promise<any>;
}
