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
exports.SubmitAnswerDto = exports.PurchaseDto = exports.CreateQuestionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateQuestionDto {
    question;
    options;
    correctIndex;
    sortOrder;
}
exports.CreateQuestionDto = CreateQuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'What is 2+2?' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['1', '2', '3', '4'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateQuestionDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateQuestionDto.prototype, "correctIndex", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateQuestionDto.prototype, "sortOrder", void 0);
class PurchaseDto {
    questionCount;
    paymentMethod;
}
exports.PurchaseDto = PurchaseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, description: 'Number of questions to buy' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PurchaseDto.prototype, "questionCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'WALLET' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PurchaseDto.prototype, "paymentMethod", void 0);
class SubmitAnswerDto {
    questionId;
    selectedIndex;
}
exports.SubmitAnswerDto = SubmitAnswerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'question-uuid' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitAnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SubmitAnswerDto.prototype, "selectedIndex", void 0);
//# sourceMappingURL=quiz.dto.js.map