"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizCategoryModule = void 0;
const common_1 = require("@nestjs/common");
const quiz_category_controller_1 = require("./quiz-category.controller");
const quiz_category_service_1 = require("./quiz-category.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let QuizCategoryModule = class QuizCategoryModule {
};
exports.QuizCategoryModule = QuizCategoryModule;
exports.QuizCategoryModule = QuizCategoryModule = __decorate([
    (0, common_1.Module)({
        controllers: [quiz_category_controller_1.QuizCategoryController],
        providers: [quiz_category_service_1.QuizCategoryService, prisma_service_1.PrismaService],
        exports: [quiz_category_service_1.QuizCategoryService],
    })
], QuizCategoryModule);
//# sourceMappingURL=quiz-category.module.js.map