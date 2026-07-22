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
exports.QuizController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const swagger_1 = require("@nestjs/swagger");
const quiz_service_1 = require("./quiz.service");
const quiz_dto_1 = require("./dto/quiz.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let QuizController = class QuizController {
    quizService;
    constructor(quizService) {
        this.quizService = quizService;
    }
    addQuestions(categoryId, dtos, levelId) {
        return this.quizService.addQuestions(categoryId, dtos, levelId);
    }
    getQuestions(categoryId, page, limit) {
        return this.quizService.getQuestions(categoryId, Number(page) || 1, Number(limit) || 50);
    }
    updateQuestion(id, dto) {
        return this.quizService.updateQuestion(id, dto);
    }
    deleteQuestion(id) {
        return this.quizService.deleteQuestion(id);
    }
    bulkDeleteQuestions(ids) {
        return this.quizService.bulkDeleteQuestions(ids);
    }
    deleteAllQuestions(categoryId) {
        return this.quizService.deleteAllQuestions(categoryId);
    }
    importCsv(categoryId, file) {
        if (!file)
            throw new common_1.BadRequestException('CSV file is required');
        if (!file.originalname.endsWith('.csv'))
            throw new common_1.BadRequestException('Only .csv files allowed');
        return this.quizService.importCsv(categoryId, file);
    }
    getCategoryCount(categoryId) {
        return this.quizService.getQuestions(categoryId, 1, 0).then((r) => ({ total: r.total }));
    }
    purchase(req, categoryId, dto) {
        return this.quizService.purchase(req.user.id, categoryId, dto);
    }
    getPurchased(req) {
        return this.quizService.getPurchased(req.user.id);
    }
    startAttempt(req, purchaseId) {
        return this.quizService.startAttempt(req.user.id, purchaseId);
    }
    submitAnswer(req, purchaseId, dto) {
        return this.quizService.submitAnswer(req.user.id, purchaseId, dto);
    }
    getNextQuestion(req, purchaseId) {
        return this.quizService.getNextQuestion(req.user.id, purchaseId);
    }
    getResult(req, purchaseId) {
        return this.quizService.getResult(req.user.id, purchaseId);
    }
};
exports.QuizController = QuizController;
__decorate([
    (0, common_1.Post)('admin/questions/:categoryId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Add questions to a category (optionally to a level)' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('levelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "addQuestions", null);
__decorate([
    (0, common_1.Get)('admin/questions/:categoryId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] List questions in a category' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "getQuestions", null);
__decorate([
    (0, common_1.Patch)('admin/questions/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Update a question' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "updateQuestion", null);
__decorate([
    (0, common_1.Delete)('admin/questions/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Delete a question' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "deleteQuestion", null);
__decorate([
    (0, common_1.Post)('admin/questions/bulk-delete'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Bulk delete questions by IDs' }),
    __param(0, (0, common_1.Body)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "bulkDeleteQuestions", null);
__decorate([
    (0, common_1.Delete)('admin/questions/category/:categoryId/all'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Delete ALL questions in a category' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "deleteAllQuestions", null);
__decorate([
    (0, common_1.Post)('admin/import-csv/:categoryId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPER_ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: (0, multer_1.memoryStorage)() })),
    (0, swagger_1.ApiOperation)({ summary: '[Admin] Bulk import questions from CSV' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Get)('category/:categoryId/count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get total question count in a category' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "getCategoryCount", null);
__decorate([
    (0, common_1.Post)('purchase/:categoryId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Purchase quiz questions from a category' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('categoryId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, quiz_dto_1.PurchaseDto]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "purchase", null);
__decorate([
    (0, common_1.Get)('purchased'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'List user purchased quizzes' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "getPurchased", null);
__decorate([
    (0, common_1.Post)('attempt/:purchaseId/start'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Start/get quiz attempt' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('purchaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "startAttempt", null);
__decorate([
    (0, common_1.Post)('attempt/:purchaseId/submit'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Submit answer for current question' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('purchaseId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, quiz_dto_1.SubmitAnswerDto]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "submitAnswer", null);
__decorate([
    (0, common_1.Get)('attempt/:purchaseId/next'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get next unanswered question' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('purchaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "getNextQuestion", null);
__decorate([
    (0, common_1.Get)('attempt/:purchaseId/result'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get quiz result' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('purchaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuizController.prototype, "getResult", null);
exports.QuizController = QuizController = __decorate([
    (0, swagger_1.ApiTags)('Quiz'),
    (0, common_1.Controller)('quiz'),
    __metadata("design:paramtypes", [quiz_service_1.QuizService])
], QuizController);
//# sourceMappingURL=quiz.controller.js.map