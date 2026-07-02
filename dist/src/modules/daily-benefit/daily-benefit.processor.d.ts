import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DailyBenefitService } from './daily-benefit.service';
export declare class DailyBenefitProcessor extends WorkerHost {
    private readonly dailyBenefitService;
    private readonly logger;
    constructor(dailyBenefitService: DailyBenefitService);
    process(job: Job<{
        userId: string;
        date: string;
    }>): Promise<void>;
}
