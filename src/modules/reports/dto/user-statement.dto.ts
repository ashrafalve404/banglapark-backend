import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ReportPeriod {
    THIS_WEEK = 'this_week',
    THIS_MONTH = 'this_month',
    LAST_MONTH = 'last_month',
    CUSTOM = 'custom',
}

export class GetUserStatementDto {
    @IsString()
    userQuery: string; // User ID, phone, email, or name

    @IsOptional()
    @IsEnum(ReportPeriod)
    period?: ReportPeriod = ReportPeriod.THIS_MONTH;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;
}
