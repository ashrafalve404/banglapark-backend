"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CpaMarketingModule = void 0;
const common_1 = require("@nestjs/common");
const cpa_marketing_controller_1 = require("./cpa-marketing.controller");
const cpa_marketing_service_1 = require("./cpa-marketing.service");
const wallet_module_1 = require("../wallet/wallet.module");
let CpaMarketingModule = class CpaMarketingModule {
};
exports.CpaMarketingModule = CpaMarketingModule;
exports.CpaMarketingModule = CpaMarketingModule = __decorate([
    (0, common_1.Module)({
        imports: [wallet_module_1.WalletModule],
        controllers: [cpa_marketing_controller_1.CpaMarketingController],
        providers: [cpa_marketing_service_1.CpaMarketingService],
        exports: [cpa_marketing_service_1.CpaMarketingService],
    })
], CpaMarketingModule);
//# sourceMappingURL=cpa-marketing.module.js.map