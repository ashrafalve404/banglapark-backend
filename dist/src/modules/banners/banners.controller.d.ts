import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
export declare class BannersController {
    private readonly bannersService;
    constructor(bannersService: BannersService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
        linkUrl: string | null;
        sortOrder: number;
    }[]>;
    findActive(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
        linkUrl: string | null;
        sortOrder: number;
    }[]>;
    create(dto: CreateBannerDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
        linkUrl: string | null;
        sortOrder: number;
    }>;
    update(id: string, dto: UpdateBannerDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
        linkUrl: string | null;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string;
        linkUrl: string | null;
        sortOrder: number;
    }>;
}
