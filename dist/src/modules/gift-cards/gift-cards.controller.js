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
exports.GiftCardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const gift_cards_service_1 = require("./gift-cards.service");
const gift_cards_dto_1 = require("./dto/gift-cards.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let GiftCardsController = class GiftCardsController {
    giftCardsService;
    constructor(giftCardsService) {
        this.giftCardsService = giftCardsService;
    }
    async adminGetStats() {
        return this.giftCardsService.adminGetStats();
    }
    async adminGetPurchases() {
        return this.giftCardsService.adminGetPurchases();
    }
    async adminApprovePurchase(id) {
        return this.giftCardsService.adminApprovePurchase(id);
    }
    async adminRejectPurchase(id) {
        return this.giftCardsService.adminRejectPurchase(id);
    }
    async adminDeletePurchase(id) {
        return this.giftCardsService.adminDeletePurchase(id);
    }
    async adminGetAllCards() {
        return this.giftCardsService.adminGetAllCards();
    }
    async adminCreateCard(dto) {
        return this.giftCardsService.adminCreateCard(dto);
    }
    async adminUpdateCard(id, dto) {
        return this.giftCardsService.adminUpdateCard(id, dto);
    }
    async adminDeleteCard(id) {
        return this.giftCardsService.adminDeleteCard(id);
    }
    async userGetPublicCards() {
        return this.giftCardsService.userGetPublicCards();
    }
    async userBuyCard(userId, cardId, dto) {
        return this.giftCardsService.userBuyCard(userId, cardId, dto);
    }
    async userGetMyCards(userId) {
        return this.giftCardsService.userGetMyCards(userId);
    }
    async userSellCard(userId, purchaseId) {
        return this.giftCardsService.userSellCard(userId, purchaseId);
    }
};
exports.GiftCardsController = GiftCardsController;
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get Gift Card sales revenue & purchase statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "adminGetStats", null);
__decorate([
    (0, common_1.Get)('admin/purchases'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get user Gift Card purchase history logs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "adminGetPurchases", null);
__decorate([
    (0, common_1.Post)('admin/purchases/:id/approve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Approve a pending bKash Gift Card purchase' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "adminApprovePurchase", null);
__decorate([
    (0, common_1.Post)('admin/purchases/:id/reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Reject a pending bKash Gift Card purchase' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "adminRejectPurchase", null);
__decorate([
    (0, common_1.Delete)('admin/purchases/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Delete a user Gift Card purchase record' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "adminDeletePurchase", null);
__decorate([
    (0, common_1.Get)('admin/cards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all Gift Cards with secret voucher codes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "adminGetAllCards", null);
__decorate([
    (0, common_1.Post)('admin/cards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Create a new Gift Card' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gift_cards_dto_1.CreateGiftCardDto]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "adminCreateCard", null);
__decorate([
    (0, common_1.Patch)('admin/cards/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update an existing Gift Card' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gift_cards_dto_1.UpdateGiftCardDto]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "adminUpdateCard", null);
__decorate([
    (0, common_1.Delete)('admin/cards/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Delete a Gift Card' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "adminDeleteCard", null);
__decorate([
    (0, common_1.Get)('public/cards'),
    (0, swagger_1.ApiOperation)({ summary: 'Public: List active Gift Cards for Home page & store' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "userGetPublicCards", null);
__decorate([
    (0, common_1.Post)('user/buy/:cardId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'User: Purchase a Gift Card via WALLET or BKASH (auto-activates account if price >= 2000 TK)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('cardId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, gift_cards_dto_1.BuyGiftCardDto]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "userBuyCard", null);
__decorate([
    (0, common_1.Get)('user/my-cards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'User: Get purchased Gift Cards with voucher codes' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "userGetMyCards", null);
__decorate([
    (0, common_1.Post)('user/sell/:purchaseId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'User: Resell a purchased Gift Card after 30 days and receive refund into Wallet' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('purchaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GiftCardsController.prototype, "userSellCard", null);
exports.GiftCardsController = GiftCardsController = __decorate([
    (0, swagger_1.ApiTags)('Gift Cards'),
    (0, common_1.Controller)('gift-cards'),
    __metadata("design:paramtypes", [gift_cards_service_1.GiftCardsService])
], GiftCardsController);
//# sourceMappingURL=gift-cards.controller.js.map