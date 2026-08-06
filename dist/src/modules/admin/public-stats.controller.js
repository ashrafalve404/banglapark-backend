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
exports.PublicStatsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../../prisma/prisma.service");
let PublicStatsController = class PublicStatsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const totalUsers = await this.prisma.user.count({ where: { role: 'USER' } });
        return { totalUsers };
    }
    async getNewMembers() {
        const members = await this.prisma.user.findMany({
            where: { role: 'USER' },
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: { id: true, name: true, profileImage: true, createdAt: true },
        });
        return members;
    }
    async getTopLeaders() {
        const topUsers = await this.prisma.user.findMany({
            where: { role: 'USER' },
            select: {
                id: true,
                name: true,
                profileImage: true,
                _count: {
                    select: { children: true },
                },
            },
            orderBy: {
                children: { _count: 'desc' },
            },
            take: 10,
        });
        return topUsers.map((u) => ({
            id: u.id,
            name: u.name,
            profileImage: u.profileImage,
            teamCount: u._count.children,
        }));
    }
};
exports.PublicStatsController = PublicStatsController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Public platform stats (user count)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicStatsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('new-members'),
    (0, swagger_1.ApiOperation)({ summary: 'Last 8 newly registered members (public)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicStatsController.prototype, "getNewMembers", null);
__decorate([
    (0, common_1.Get)('top-leaders'),
    (0, swagger_1.ApiOperation)({ summary: 'Top 10 users by team member count (public)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicStatsController.prototype, "getTopLeaders", null);
exports.PublicStatsController = PublicStatsController = __decorate([
    (0, swagger_1.ApiTags)('Public'),
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicStatsController);
//# sourceMappingURL=public-stats.controller.js.map