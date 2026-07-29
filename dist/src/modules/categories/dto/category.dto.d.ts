export declare class CreateCategoryDto {
    name: string;
    slug?: string;
    image?: string;
    sortOrder?: number;
    isHidden?: boolean;
}
export declare class UpdateCategoryDto {
    name?: string;
    slug?: string;
    image?: string;
    sortOrder?: number;
    isHidden?: boolean;
}
export declare class BulkCreateCategoriesDto {
    names: string[];
}
