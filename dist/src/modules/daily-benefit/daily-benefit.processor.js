"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DailyBenefitProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyBenefitProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const daily_benefit_service_1 = require("./daily-benefit.service");
let DailyBenefitProcessor = DailyBenefitProcessor_1 = class DailyBenefitProcessor extends bullmq_1.WorkerHost {
    dailyBenefitService;
    logger = new common_1.Logger(DailyBenefitProcessor_1.name);
    constructor(dailyBenefitService) {
        super();
        this.dailyBenefitService = dailyBenefitService;
    }
    async process(job) {
        const { userId, date } = job.data;
        this.logger.debug(`Processing daily benefit job for user ${userId} on ${date}`);
        await this.dailyBenefitService.payBenefitForUser(userId, date);
    }
};
exports.DailyBenefitProcessor = DailyBenefitProcessor;
exports.DailyBenefitProcessor = DailyBenefitProcessor = DailyBenefitProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(daily_benefit_service_1.DAILY_BENEFIT_QUEUE),
    __metadata("design:paramtypes", [daily_benefit_service_1.DailyBenefitService])
], DailyBenefitProcessor);
//# sourceMappingURL=daily-benefit.processor.js.map