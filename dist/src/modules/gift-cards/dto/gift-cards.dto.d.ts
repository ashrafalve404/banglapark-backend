export declare class CreateGiftCardDto {
    title: string;
    description?: string;
    price: number;
    image?: string;
    voucherCode?: string;
    isActive?: boolean;
}
export declare class UpdateGiftCardDto {
    title?: string;
    description?: string;
    price?: number;
    image?: string;
    voucherCode?: string;
    isActive?: boolean;
}
export declare class BuyGiftCardDto {
    paymentMethod?: 'WALLET' | 'BKASH';
    userBkashNumber?: string;
    bkashTrxId?: string;
}
