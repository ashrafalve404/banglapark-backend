"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalModule = void 0;
const common_1 = require("@nestjs/common");
const withdrawal_controller_1 = require("./withdrawal.controller");
const withdrawal_service_1 = require("./withdrawal.service");
const wallet_module_1 = require("../wallet/wallet.module");
const notifications_module_1 = require("../notifications/notifications.module");
let WithdrawalModule = class WithdrawalModule {
};
exports.WithdrawalModule = WithdrawalModule;
exports.WithdrawalModule = WithdrawalModule = __decorate([
    (0, common_1.Module)({
        imports: [wallet_module_1.WalletModule, notifications_module_1.NotificationsModule],
        controllers: [withdrawal_controller_1.WithdrawalController],
        providers: [withdrawal_service_1.WithdrawalService],
        exports: [withdrawal_service_1.WithdrawalService],
    })
], WithdrawalModule);
//# sourceMappingURL=withdrawal.module.js.map