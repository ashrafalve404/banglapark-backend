import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DailyBenefitService, DAILY_BENEFIT_QUEUE } from './daily-benefit.service';

@Processor(DAILY_BENEFIT_QUEUE)
export class DailyBenefitProcessor extends WorkerHost {
    private readonly logger = new Logger(DailyBenefitProcessor.name);

    constructor(private readonly dailyBenefitService: DailyBenefitService) {
        super();
    }

    async process(job: Job<{ userId: string; date: string }>) {
        const { userId, date } = job.data;
        this.logger.debug(`Processing daily benefit job for user ${userId} on ${date}`);
        await this.dailyBenefitService.payBenefitForUser(userId, date);
    }
}
