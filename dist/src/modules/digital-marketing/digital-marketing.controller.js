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
exports.DigitalMarketingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const digital_marketing_service_1 = require("./digital-marketing.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
class PurchasePackageDto {
    packageId;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PurchasePackageDto.prototype, "packageId", void 0);
class CreatePackageDto {
    title;
    description;
    price;
    profitPercent;
    durationHours;
    isHidden;
    sortOrder;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePackageDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePackageDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePackageDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePackageDto.prototype, "profitPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePackageDto.prototype, "durationHours", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePackageDto.prototype, "isHidden", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePackageDto.prototype, "sortOrder", void 0);
class UpdatePackageDto {
    title;
    description;
    price;
    profitPercent;
    durationHours;
    isHidden;
    sortOrder;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePackageDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePackageDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdatePackageDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePackageDto.prototype, "profitPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePackageDto.prototype, "durationHours", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePackageDto.prototype, "isHidden", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePackageDto.prototype, "sortOrder", void 0);
let DigitalMarketingController = class DigitalMarketingController {
    dmService;
    constructor(dmService) {
        this.dmService = dmService;
    }
    getPackages() {
        return this.dmService.getPackages();
    }
    purchase(userId, dto) {
        return this.dmService.purchasePackage(userId, dto.packageId);
    }
    getMyPurchases(userId) {
        return this.dmService.getMyPurchases(userId);
    }
    adminGetAllPackages() {
        return this.dmService.adminGetAllPackages();
    }
    adminCreatePackage(dto) {
        return this.dmService.adminCreatePackage(dto);
    }
    adminUpdatePackage(id, dto) {
        return this.dmService.adminUpdatePackage(id, dto);
    }
    adminDeletePackage(id) {
        return this.dmService.adminDeletePackage(id);
    }
    adminGetAllPurchases(page = 1, limit = 20, status) {
        return this.dmService.adminGetAllPurchases(+page, +limit, status);
    }
};
exports.DigitalMarketingController = DigitalMarketingController;
__decorate([
    (0, common_1.Get)('packages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active digital marketing packages' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DigitalMarketingController.prototype, "getPackages", null);
__decorate([
    (0, common_1.Post)('purchase'),
    (0, swagger_1.ApiOperation)({ summary: 'Purchase a digital marketing package with wallet balance' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, PurchasePackageDto]),
    __metadata("design:returntype", void 0)
], DigitalMarketingController.prototype, "purchase", null);
__decorate([
    (0, common_1.Get)('my-purchases'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my digital marketing package purchases & active returns' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DigitalMarketingController.prototype, "getMyPurchases", null);
__decorate([
    (0, common_1.Get)('admin/packages'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Get all packages' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DigitalMarketingController.prototype, "adminGetAllPackages", null);
__decorate([
    (0, common_1.Post)('admin/packages'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Create a package' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePackageDto]),
    __metadata("design:returntype", void 0)
], DigitalMarketingController.prototype, "adminCreatePackage", null);
__decorate([
    (0, common_1.Patch)('admin/packages/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Update a package' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdatePackageDto]),
    __metadata("design:returntype", void 0)
], DigitalMarketingController.prototype, "adminUpdatePackage", null);
__decorate([
    (0, common_1.Delete)('admin/packages/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Delete a package' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DigitalMarketingController.prototype, "adminDeletePackage", null);
__decorate([
    (0, common_1.Get)('admin/purchases'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] List all user digital marketing purchases' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], DigitalMarketingController.prototype, "adminGetAllPurchases", null);
exports.DigitalMarketingController = DigitalMarketingController = __decorate([
    (0, swagger_1.ApiTags)('Digital Marketing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('digital-marketing'),
    __metadata("design:paramtypes", [digital_marketing_service_1.DigitalMarketingService])
], DigitalMarketingController);
//# sourceMappingURL=digital-marketing.controller.js.map