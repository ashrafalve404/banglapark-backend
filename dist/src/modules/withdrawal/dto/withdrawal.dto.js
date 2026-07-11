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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewWithdrawalDto = exports.CreateWithdrawalDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateWithdrawalDto {
    amount;
    method;
    accountDetails;
}
exports.CreateWithdrawalDto = CreateWithdrawalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1500 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(2000),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateWithdrawalDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.WithdrawMethod }),
    (0, class_validator_1.IsEnum)(client_1.WithdrawMethod),
    __metadata("design:type", String)
], CreateWithdrawalDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: { accountNumber: '01812345678', accountName: 'Rahim' },
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateWithdrawalDto.prototype, "accountDetails", void 0);
class ReviewWithdrawalDto {
    status;
    reason;
}
exports.ReviewWithdrawalDto = ReviewWithdrawalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['APPROVED', 'REJECTED'] }),
    (0, class_validator_1.IsEnum)(['APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], ReviewWithdrawalDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Account details mismatch' }),
    (0, class_validator_1.ValidateIf)((o) => o.status === 'REJECTED'),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewWithdrawalDto.prototype, "reason", void 0);
//# sourceMappingURL=withdrawal.dto.js.map