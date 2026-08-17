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
exports.CpaMarketingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cpa_marketing_service_1 = require("./cpa-marketing.service");
const cpa_marketing_dto_1 = require("./dto/cpa-marketing.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let CpaMarketingController = class CpaMarketingController {
    cpaService;
    constructor(cpaService) {
        this.cpaService = cpaService;
    }
    async adminGetStats() {
        return this.cpaService.adminGetStats();
    }
    async adminGetAllPurchases() {
        return this.cpaService.adminGetAllPurchases();
    }
    async adminGetAllTasks() {
        return this.cpaService.adminGetAllTasks();
    }
    async adminCreateTask(dto) {
        return this.cpaService.adminCreateTask(dto);
    }
    async adminUpdateTask(id, dto) {
        return this.cpaService.adminUpdateTask(id, dto);
    }
    async adminDeleteTask(id) {
        return this.cpaService.adminDeleteTask(id);
    }
    async userGetPublicTasks(userId) {
        return this.cpaService.userGetPublicTasks(userId);
    }
    async userBuyTask(userId, taskId) {
        return this.cpaService.userBuyTask(userId, taskId);
    }
    async userGetMyPurchases(userId) {
        return this.cpaService.userGetMyPurchases(userId);
    }
    async userCompleteTask(userId, purchaseId) {
        return this.cpaService.userCompleteTask(userId, purchaseId);
    }
};
exports.CpaMarketingController = CpaMarketingController;
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get CPA marketing revenue, purchase, & task statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CpaMarketingController.prototype, "adminGetStats", null);
__decorate([
    (0, common_1.Get)('admin/purchases'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get detailed user purchase history logs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CpaMarketingController.prototype, "adminGetAllPurchases", null);
__decorate([
    (0, common_1.Get)('admin/tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all CPA tasks with secret redirect links' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CpaMarketingController.prototype, "adminGetAllTasks", null);
__decorate([
    (0, common_1.Post)('admin/tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Create a new CPA task' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cpa_marketing_dto_1.CreateCpaTaskDto]),
    __metadata("design:returntype", Promise)
], CpaMarketingController.prototype, "adminCreateTask", null);
__decorate([
    (0, common_1.Patch)('admin/tasks/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update an existing CPA task' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cpa_marketing_dto_1.UpdateCpaTaskDto]),
    __metadata("design:returntype", Promise)
], CpaMarketingController.prototype, "adminUpdateTask", null);
__decorate([
    (0, common_1.Delete)('admin/tasks/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Delete a CPA task' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CpaMarketingController.prototype, "adminDeleteTask", null);
__decorate([
    (0, common_1.Get)('public/tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'User: List active CPA tasks (redirect link omitted for privacy)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CpaMarketingController.prototype, "userGetPublicTasks", null);
__decorate([
    (0, common_1.Post)('user/buy/:taskId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'User: Purchase a CPA task using Wallet balance' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CpaMarketingController.prototype, "userBuyTask", null);
__decorate([
    (0, common_1.Get)('user/my-purchases'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'User: Get purchased CPA tasks with redirect links for Daily Work' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CpaMarketingController.prototype, "userGetMyPurchases", null);
__decorate([
    (0, common_1.Post)('user/complete/:purchaseId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'User: Complete a purchased CPA task and open redirect link' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('purchaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CpaMarketingController.prototype, "userCompleteTask", null);
exports.CpaMarketingController = CpaMarketingController = __decorate([
    (0, swagger_1.ApiTags)('CPA Marketing'),
    (0, common_1.Controller)('cpa-marketing'),
    __metadata("design:paramtypes", [cpa_marketing_service_1.CpaMarketingService])
], CpaMarketingController);
//# sourceMappingURL=cpa-marketing.controller.js.map