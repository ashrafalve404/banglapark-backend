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
exports.TravelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const travel_service_1 = require("./travel.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let TravelController = class TravelController {
    travelService;
    constructor(travelService) {
        this.travelService = travelService;
    }
    getUserEligibility(userId) {
        return this.travelService.getUserEligibility(userId);
    }
    getAchievers(month, year) {
        return this.travelService.getAchieversList(month, year);
    }
    getAdminTiers(month, year) {
        return this.travelService.getTiersForMonth(month, year);
    }
    upsertTier(body) {
        return this.travelService.upsertTier(body.tierNumber, body.destinations, body.month, body.year);
    }
    clearTier(tierNumber, month, year) {
        return this.travelService.clearTier(tierNumber, month, year);
    }
};
exports.TravelController = TravelController;
__decorate([
    (0, common_1.Get)('eligibility'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user travel eligibility for this month' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TravelController.prototype, "getUserEligibility", null);
__decorate([
    (0, common_1.Get)('achievers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of monthly travel achievers' }),
    __param(0, (0, common_1.Query)('month', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('year', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], TravelController.prototype, "getAchievers", null);
__decorate([
    (0, common_1.Get)('admin/tiers'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Get travel tiers for a month/year' }),
    __param(0, (0, common_1.Query)('month', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('year', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], TravelController.prototype, "getAdminTiers", null);
__decorate([
    (0, common_1.Post)('admin/tiers'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Upsert travel tier destinations' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TravelController.prototype, "upsertTier", null);
__decorate([
    (0, common_1.Delete)('admin/tiers/:tierNumber'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Clear travel tier for a month/year' }),
    __param(0, (0, common_1.Param)('tierNumber', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('month', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('year', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], TravelController.prototype, "clearTier", null);
exports.TravelController = TravelController = __decorate([
    (0, swagger_1.ApiTags)('Travel'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('travel'),
    __metadata("design:paramtypes", [travel_service_1.TravelService])
], TravelController);
//# sourceMappingURL=travel.controller.js.map