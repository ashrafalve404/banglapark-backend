"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProductsModule = void 0;
const common_1 = require("@nestjs/common");
const user_products_controller_1 = require("./user-products.controller");
const user_products_service_1 = require("./user-products.service");
let UserProductsModule = class UserProductsModule {
};
exports.UserProductsModule = UserProductsModule;
exports.UserProductsModule = UserProductsModule = __decorate([
    (0, common_1.Module)({
        controllers: [user_products_controller_1.UserProductsController],
        providers: [user_products_service_1.UserProductsService],
        exports: [user_products_service_1.UserProductsService],
    })
], UserProductsModule);
//# sourceMappingURL=user-products.module.js.map