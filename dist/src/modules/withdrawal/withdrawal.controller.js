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
exports.WithdrawalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const withdrawal_service_1 = require("./withdrawal.service");
const withdrawal_dto_1 = require("./dto/withdrawal.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_2 = require("@prisma/client");
let WithdrawalController = class WithdrawalController {
    withdrawalService;
    constructor(withdrawalService) {
        this.withdrawalService = withdrawalService;
    }
    request(userId, dto) {
        return this.withdrawalService.request(userId, dto);
    }
    getMyRequests(userId, page = 1, limit = 20) {
        return this.withdrawalService.getMyRequests(userId, +page, +limit);
    }
    getAllRequests(page = 1, limit = 20, status) {
        return this.withdrawalService.getAllRequests(+page, +limit, status);
    }
    review(id, adminId, dto) {
        return this.withdrawalService.review(id, adminId, dto);
    }
};
exports.WithdrawalController = WithdrawalController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Request a withdrawal' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, withdrawal_dto_1.CreateWithdrawalDto]),
    __metadata("design:returntype", void 0)
], WithdrawalController.prototype, "request", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my withdrawal requests' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], WithdrawalController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, roles_decorator_1.Roles)(client_2.Role.ADMIN, client_2.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] List all withdrawal requests' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.WithdrawStatus }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], WithdrawalController.prototype, "getAllRequests", null);
__decorate([
    (0, common_1.Patch)('admin/:id/review'),
    (0, roles_decorator_1.Roles)(client_2.Role.ADMIN, client_2.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Approve or reject a withdrawal' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, withdrawal_dto_1.ReviewWithdrawalDto]),
    __metadata("design:returntype", void 0)
], WithdrawalController.prototype, "review", null);
exports.WithdrawalController = WithdrawalController = __decorate([
    (0, swagger_1.ApiTags)('Withdrawal'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('withdrawals'),
    __metadata("design:paramtypes", [withdrawal_service_1.WithdrawalService])
], WithdrawalController);
//# sourceMappingURL=withdrawal.controller.js.map