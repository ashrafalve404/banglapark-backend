import { PrismaService } from '../../prisma/prisma.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
export declare class BannersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        imageUrl: string;
        linkUrl: string | null;
        isActive: boolean;
        sortOrder: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findActive(): Promise<{
        imageUrl: string;
        linkUrl: string | null;
        isActive: boolean;
        sortOrder: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(dto: CreateBannerDto): Promise<{
        imageUrl: string;
        linkUrl: string | null;
        isActive: boolean;
        sortOrder: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateBannerDto): Promise<{
        imageUrl: string;
        linkUrl: string | null;
        isActive: boolean;
        sortOrder: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        imageUrl: string;
        linkUrl: string | null;
        isActive: boolean;
        sortOrder: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
