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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const crypto_1 = require("crypto");
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 20 * 1024 * 1024;
function uploadDir() {
    return process.env.UPLOAD_DIR || (0, path_1.join)(process.cwd(), 'uploads');
}
let UploadsController = class UploadsController {
    upload(file, req) {
        if (!file)
            throw new common_1.BadRequestException('File is required');
        const protocol = req.protocol;
        const host = req.get('host');
        return { url: `${protocol}://${host}/uploads/${file.filename}` };
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (_req, _file, cb) => cb(null, uploadDir()),
            filename: (_req, file, cb) => {
                const ext = (0, path_1.extname)(file.originalname);
                cb(null, `${(0, crypto_1.randomUUID)()}${ext}`);
            },
        }),
        limits: { fileSize: MAX_SIZE },
        fileFilter: (_req, file, cb) => {
            if (!ALLOWED_TYPES.includes(file.mimetype)) {
                return cb(new common_1.BadRequestException('Only JPG, PNG, WebP & GIF allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "upload", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads')
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map