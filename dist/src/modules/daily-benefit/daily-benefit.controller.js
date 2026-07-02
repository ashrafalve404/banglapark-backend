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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyBenefitController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const daily_benefit_service_1 = require("./daily-benefit.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let DailyBenefitController = class DailyBenefitController {
    dailyBenefitService;
    constructor(dailyBenefitService) {
        this.dailyBenefitService = dailyBenefitService;
    }
    getTiers() {
        return this.dailyBenefitService.getTiers();
    }
    getMyLogs(userId, page = 1, limit = 20) {
        return this.dailyBenefitService.getLogs(userId, +page, +limit);
    }
    getAllLogs(page = 1, limit = 20) {
        return this.dailyBenefitService.getLogs(undefined, +page, +limit);
    }
};
exports.DailyBenefitController = DailyBenefitController;
__decorate([
    (0, common_1.Get)('tiers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the daily benefit tier table' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DailyBenefitController.prototype, "getTiers", null);
__decorate([
    (0, common_1.Get)('my/logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my daily benefit history' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], DailyBenefitController.prototype, "getMyLogs", null);
__decorate([
    (0, common_1.Get)('admin/logs'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Get all daily benefit logs' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DailyBenefitController.prototype, "getAllLogs", null);
exports.DailyBenefitController = DailyBenefitController = __decorate([
    (0, swagger_1.ApiTags)('Daily Benefit'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('daily-benefit'),
    __metadata("design:paramtypes", [daily_benefit_service_1.DailyBenefitService])
], DailyBenefitController);
//# sourceMappingURL=daily-benefit.controller.js.map