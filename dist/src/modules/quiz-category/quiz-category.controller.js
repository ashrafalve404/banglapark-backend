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
exports.QuizCategoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const quiz_category_service_1 = require("./quiz-category.service");
const quiz_category_dto_1 = require("./dto/quiz-category.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let QuizCategoryController = class QuizCategoryController {
    service;
    constructor(service) {
        this.service = service;
    }
    findActive() { return this.service.findActive(); }
    findAll() { return this.service.findAll(); }
    findOne(id) { return this.service.findOne(id); }
    create(dto) { return this.service.create(dto); }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    remove(id) { return this.service.remove(id); }
};
exports.QuizCategoryController = QuizCategoryController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List active quiz categories with quiz count (public)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuizCategoryController.prototype, "findActive", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'List all quiz categories (public)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuizCategoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single quiz category' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuizCategoryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Create quiz category' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quiz_category_dto_1.CreateQuizCategoryDto]),
    __metadata("design:returntype", void 0)
], QuizCategoryController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Update quiz category' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quiz_category_dto_1.UpdateQuizCategoryDto]),
    __metadata("design:returntype", void 0)
], QuizCategoryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Delete quiz category' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuizCategoryController.prototype, "remove", null);
exports.QuizCategoryController = QuizCategoryController = __decorate([
    (0, swagger_1.ApiTags)('Quiz Categories'),
    (0, common_1.Controller)('quiz-categories'),
    __metadata("design:paramtypes", [quiz_category_service_1.QuizCategoryService])
], QuizCategoryController);
//# sourceMappingURL=quiz-category.controller.js.map