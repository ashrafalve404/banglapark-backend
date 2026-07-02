import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockWallet = {
    id: 'wallet-1',
    userId: 'user-1',
    balance: 500,
    pendingWithdrawal: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockPrisma = {
    wallet: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    walletTransaction: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
    },
};

describe('WalletService', () => {
    let service: WalletService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WalletService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<WalletService>(WalletService);
        jest.clearAllMocks();
    });

    describe('credit', () => {
        it('increases balance and creates transaction log', async () => {
            const updatedWallet = { ...mockWallet, balance: 700 };
            mockPrisma.wallet.update.mockResolvedValue(updatedWallet);
            mockPrisma.walletTransaction.create.mockResolvedValue({});

            const tx = mockPrisma as any;
            await service.credit(tx, 'wallet-1', 200, 'DAILY_BENEFIT', 'Test credit');

            expect(mockPrisma.wallet.update).toHaveBeenCalledWith({
                where: { id: 'wallet-1' },
                data: { balance: { increment: 200 } },
            });
            expect(mockPrisma.walletTransaction.create).toHaveBeenCalledTimes(1);
        });
    });

    describe('debit', () => {
        it('decreases balance when sufficient funds exist', async () => {
            mockPrisma.wallet.findUnique.mockResolvedValue(mockWallet);
            const updatedWallet = { ...mockWallet, balance: 300 };
            mockPrisma.wallet.update.mockResolvedValue(updatedWallet);
            mockPrisma.walletTransaction.create.mockResolvedValue({});

            const tx = mockPrisma as any;
            await service.debit(tx, 'wallet-1', 200, 'WITHDRAWAL', 'Test debit');

            expect(mockPrisma.wallet.update).toHaveBeenCalled();
            expect(mockPrisma.walletTransaction.create).toHaveBeenCalledTimes(1);
        });

        it('throws BadRequestException when balance is insufficient', async () => {
            mockPrisma.wallet.findUnique.mockResolvedValue({
                ...mockWallet,
                balance: 50,
            });

            const tx = mockPrisma as any;
            await expect(
                service.debit(tx, 'wallet-1', 200, 'WITHDRAWAL', 'Test debit'),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws NotFoundException when wallet does not exist', async () => {
            mockPrisma.wallet.findUnique.mockResolvedValue(null);

            const tx = mockPrisma as any;
            await expect(
                service.debit(tx, 'wallet-1', 200, 'WITHDRAWAL', 'Test debit'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('getBalance', () => {
        it('returns balance with availableBalance derived', async () => {
            mockPrisma.wallet.findUnique.mockResolvedValue({
                id: 'wallet-1',
                balance: 500,
                pendingWithdrawal: 200,
            });

            const result = await service.getBalance('user-1');
            expect(result.availableBalance).toBe(300);
        });

        it('throws NotFoundException when wallet not found', async () => {
            mockPrisma.wallet.findUnique.mockResolvedValue(null);
            await expect(service.getBalance('user-1')).rejects.toThrow(NotFoundException);
        });
    });
});
