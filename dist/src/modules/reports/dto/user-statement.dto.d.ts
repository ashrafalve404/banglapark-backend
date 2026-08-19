export declare enum ReportPeriod {
    THIS_WEEK = "this_week",
    THIS_MONTH = "this_month",
    LAST_MONTH = "last_month",
    CUSTOM = "custom"
}
export declare class GetUserStatementDto {
    userQuery: string;
    period?: ReportPeriod;
    startDate?: string;
    endDate?: string;
}
