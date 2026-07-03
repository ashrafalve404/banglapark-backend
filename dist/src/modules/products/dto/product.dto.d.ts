export declare class CreateProductDto {
    name: string;
    description?: string;
    price: number;
    stock: number;
    categoryId: string;
    images?: string[];
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryId?: string;
    images?: string[];
    isActive?: boolean;
}
export declare class ProductQueryDto {
    search?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
    sort?: 'price_asc' | 'price_desc' | 'newest';
}
