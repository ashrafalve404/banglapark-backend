import { GiftCardsService } from './gift-cards.service';
import { CreateGiftCardDto, UpdateGiftCardDto, BuyGiftCardDto } from './dto/gift-cards.dto';
export declare class GiftCardsController {
    private readonly giftCardsService;
    constructor(giftCardsService: GiftCardsService);
    adminGetStats(): Promise<{
        totalRevenue: number;
        totalPurchases: any;
        totalResalePayout: number;
        totalCardsSold: any;
        totalCards: any;
        activeCards: any;
        uniqueBuyers: any;
        activatedAccountsCount: any;
    }>;
    adminGetPurchases(): Promise<any>;
    adminGetAllCards(): Promise<any>;
    adminCreateCard(dto: CreateGiftCardDto): Promise<any>;
    adminUpdateCard(id: string, dto: UpdateGiftCardDto): Promise<any>;
    adminDeleteCard(id: string): Promise<{
        message: string;
    }>;
    userGetPublicCards(): Promise<any>;
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
    userGetMyCards(userId: string): Promise<any>;
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
}
