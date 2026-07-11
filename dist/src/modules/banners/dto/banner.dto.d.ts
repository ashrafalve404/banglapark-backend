import { BannerSection } from '@prisma/client';
export declare class CreateBannerDto {
    section?: BannerSection;
    imageUrl: string;
    linkUrl?: string;
    title?: string;
    badge?: string;
    isActive?: boolean;
    sortOrder?: number;
}
export declare class UpdateBannerDto {
    section?: BannerSection;
    imageUrl?: string;
    linkUrl?: string;
    title?: string;
    badge?: string;
    isActive?: boolean;
    sortOrder?: number;
}
