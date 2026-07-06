import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
export declare class BannersController {
    private readonly bannersService;
    constructor(bannersService: BannersService);
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
