"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyBenefitModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const daily_benefit_controller_1 = require("./daily-benefit.controller");
const daily_benefit_service_1 = require("./daily-benefit.service");
const daily_benefit_processor_1 = require("./daily-benefit.processor");
const wallet_module_1 = require("../wallet/wallet.module");
let DailyBenefitModule = class DailyBenefitModule {
};
exports.DailyBenefitModule = DailyBenefitModule;
exports.DailyBenefitModule = DailyBenefitModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({ name: daily_benefit_service_1.DAILY_BENEFIT_QUEUE }),
            wallet_module_1.WalletModule,
        ],
        controllers: [daily_benefit_controller_1.DailyBenefitController],
        providers: [daily_benefit_service_1.DailyBenefitService, daily_benefit_processor_1.DailyBenefitProcessor],
        exports: [daily_benefit_service_1.DailyBenefitService],
    })
], DailyBenefitModule);
//# sourceMappingURL=daily-benefit.module.js.map