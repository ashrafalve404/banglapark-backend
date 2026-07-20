"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizLevelModule = void 0;
const common_1 = require("@nestjs/common");
const quiz_level_controller_1 = require("./quiz-level.controller");
const quiz_level_service_1 = require("./quiz-level.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let QuizLevelModule = class QuizLevelModule {
};
exports.QuizLevelModule = QuizLevelModule;
exports.QuizLevelModule = QuizLevelModule = __decorate([
    (0, common_1.Module)({
        controllers: [quiz_level_controller_1.QuizLevelController],
        providers: [quiz_level_service_1.QuizLevelService, prisma_service_1.PrismaService],
        exports: [quiz_level_service_1.QuizLevelService],
    })
], QuizLevelModule);
//# sourceMappingURL=quiz-level.module.js.map