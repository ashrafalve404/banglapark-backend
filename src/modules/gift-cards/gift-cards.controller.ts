import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GiftCardsService } from './gift-cards.service';
import { CreateGiftCardDto, UpdateGiftCardDto, BuyGiftCardDto } from './dto/gift-cards.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Gift Cards')
@Controller('gift-cards')
export class GiftCardsController {
    constructor(private readonly giftCardsService: GiftCardsService) { }

    // ── Admin Endpoints ──────────────────────────────────────────────────────

    @Get('admin/stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Get Gift Card sales revenue & purchase statistics' })
    async adminGetStats() {
        return this.giftCardsService.adminGetStats();
    }

    @Get('admin/purchases')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Get user Gift Card purchase history logs' })
    async adminGetPurchases() {
        return this.giftCardsService.adminGetPurchases();
    }

    @Get('admin/cards')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Get all Gift Cards with secret voucher codes' })
    async adminGetAllCards() {
        return this.giftCardsService.adminGetAllCards();
    }

    @Post('admin/cards')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Create a new Gift Card' })
    async adminCreateCard(@Body() dto: CreateGiftCardDto) {
        return this.giftCardsService.adminCreateCard(dto);
    }

    @Patch('admin/cards/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Update an existing Gift Card' })
    async adminUpdateCard(@Param('id') id: string, @Body() dto: UpdateGiftCardDto) {
        return this.giftCardsService.adminUpdateCard(id, dto);
    }

    @Delete('admin/cards/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Admin: Delete a Gift Card' })
    async adminDeleteCard(@Param('id') id: string) {
        return this.giftCardsService.adminDeleteCard(id);
    }

    // ── User / Public Endpoints ───────────────────────────────────────────────

    @Get('public/cards')
    @ApiOperation({ summary: 'Public: List active Gift Cards for Home page & store' })
    async userGetPublicCards() {
        return this.giftCardsService.userGetPublicCards();
    }

    @Post('user/buy/:cardId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User: Purchase a Gift Card via WALLET or BKASH (auto-activates account if price >= 2000 TK)' })
    async userBuyCard(
        @CurrentUser('id') userId: string,
        @Param('cardId') cardId: string,
        @Body() dto?: BuyGiftCardDto,
    ) {
        return this.giftCardsService.userBuyCard(userId, cardId, dto);
    }

    @Get('user/my-cards')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User: Get purchased Gift Cards with voucher codes' })
    async userGetMyCards(@CurrentUser('id') userId: string) {
        return this.giftCardsService.userGetMyCards(userId);
    }

    @Post('user/sell/:purchaseId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User: Resell a purchased Gift Card after 30 days and receive refund into Wallet' })
    async userSellCard(
        @CurrentUser('id') userId: string,
        @Param('purchaseId') purchaseId: string,
    ) {
        return this.giftCardsService.userSellCard(userId, purchaseId);
    }
}
