import { PrismaService } from '../../prisma/prisma.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
export declare class BannersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        section: import("@prisma/client").$Enums.BannerSection;
        imageUrl: string;
        linkUrl: string | null;
        title: string | null;
        badge: string | null;
        sortOrder: number;
    }[]>;
    findActive(section?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        section: import("@prisma/client").$Enums.BannerSection;
        imageUrl: string;
        linkUrl: string | null;
        title: string | null;
        badge: string | null;
        sortOrder: number;
    }[]>;
    findOffers(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        section: import("@prisma/client").$Enums.BannerSection;
        imageUrl: string;
        linkUrl: string | null;
        title: string | null;
        badge: string | null;
        sortOrder: number;
    }[]>;
    create(dto: CreateBannerDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        section: import("@prisma/client").$Enums.BannerSection;
        imageUrl: string;
        linkUrl: string | null;
        title: string | null;
        badge: string | null;
        sortOrder: number;
    }>;
    update(id: string, dto: UpdateBannerDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        section: import("@prisma/client").$Enums.BannerSection;
        imageUrl: string;
        linkUrl: string | null;
        title: string | null;
        badge: string | null;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        section: import("@prisma/client").$Enums.BannerSection;
        imageUrl: string;
        linkUrl: string | null;
        title: string | null;
        badge: string | null;
        sortOrder: number;
    }>;
}
