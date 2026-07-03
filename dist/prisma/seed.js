"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@banglapark.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'superadmin@banglapark.com',
            phone: '01700000000',
            passwordHash: await bcrypt.hash('SuperAdmin@123', 12),
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            referralCode: 'REF-SUPERADM',
            referralLink: 'http://localhost:3000/register?ref=REF-SUPERADM',
            isFirstActivated: true,
        },
    });
    await prisma.wallet.upsert({
        where: { userId: superAdmin.id },
        update: {},
        create: { userId: superAdmin.id },
    });
    console.log('✅ Super Admin created:', superAdmin.email);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@banglapark.com' },
        update: {},
        create: {
            name: 'Admin',
            email: 'admin@banglapark.com',
            phone: '01700000001',
            passwordHash: await bcrypt.hash('Admin@123', 12),
            role: 'ADMIN',
            status: 'ACTIVE',
            referralCode: 'REF-ADMIN001',
            referralLink: 'http://localhost:3000/register?ref=REF-ADMIN001',
            isFirstActivated: true,
        },
    });
    await prisma.wallet.upsert({
        where: { userId: admin.id },
        update: {},
        create: { userId: admin.id },
    });
    console.log('✅ Admin created:', admin.email);
    const user = await prisma.user.upsert({
        where: { email: 'user@banglapark.com' },
        update: {},
        create: {
            name: 'Test User',
            email: 'user@banglapark.com',
            phone: '01700000002',
            passwordHash: await bcrypt.hash('User@123', 12),
            role: 'USER',
            status: 'ACTIVE',
            referralCode: 'REF-USER001',
            referralLink: 'http://localhost:3001/register?ref=REF-USER001',
            isFirstActivated: true,
        },
    });
    await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
    });
    console.log('✅ Regular User created:', user.email);
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { slug: 'health-beauty' },
            update: {},
            create: { name: 'Health & Beauty', slug: 'health-beauty' },
        }),
        prisma.category.upsert({
            where: { slug: 'clothing' },
            update: {},
            create: { name: 'Clothing & Accessories', slug: 'clothing' },
        }),
        prisma.category.upsert({
            where: { slug: 'electronics' },
            update: {},
            create: { name: 'Electronics', slug: 'electronics' },
        }),
        prisma.category.upsert({
            where: { slug: 'food-supplements' },
            update: {},
            create: { name: 'Food & Supplements', slug: 'food-supplements' },
        }),
    ]);
    console.log(`✅ ${categories.length} categories created`);
    const products = [
        {
            name: 'Premium Skin Care Kit',
            slug: 'premium-skin-care-kit',
            description: 'A complete skin care kit with natural ingredients.',
            price: 2500,
            stock: 100,
            categoryId: categories[0].id,
            images: [],
        },
        {
            name: 'Herbal Supplement Pack',
            slug: 'herbal-supplement-pack',
            description: 'Daily wellness supplement pack.',
            price: 1800,
            stock: 200,
            categoryId: categories[3].id,
            images: [],
        },
        {
            name: 'Smart Watch',
            slug: 'smart-watch-basic',
            description: 'Feature-packed smart watch at an affordable price.',
            price: 3500,
            stock: 50,
            categoryId: categories[2].id,
            images: [],
        },
        {
            name: 'Traditional Panjabi Set',
            slug: 'traditional-panjabi-set',
            description: 'Premium quality panjabi for formal occasions.',
            price: 2200,
            stock: 75,
            categoryId: categories[1].id,
            images: [],
        },
    ];
    for (const product of products) {
        await prisma.product.upsert({
            where: { slug: product.slug },
            update: {},
            create: product,
        });
    }
    console.log(`✅ ${products.length} sample products created`);
    await prisma.platformConfig.upsert({
        where: { key: 'generation_commission' },
        update: {},
        create: {
            key: 'generation_commission',
            value: { amountPerLevel: 200, levels: 10 },
        },
    });
    await prisma.platformConfig.upsert({
        where: { key: 'activation_rules' },
        update: {},
        create: {
            key: 'activation_rules',
            value: { qualifyingAmount: 2000, activationDays: 30 },
        },
    });
    await prisma.platformConfig.upsert({
        where: { key: 'withdrawal_rules' },
        update: {},
        create: {
            key: 'withdrawal_rules',
            value: { minAmount: 1000 },
        },
    });
    await prisma.platformConfig.upsert({
        where: { key: 'daily_benefit_tiers' },
        update: {},
        create: {
            key: 'daily_benefit_tiers',
            value: {
                tiers: [
                    { minCount: 10000, amount: 5000 },
                    { minCount: 5000, amount: 2000 },
                    { minCount: 500, amount: 1000 },
                    { minCount: 100, amount: 500 },
                    { minCount: 50, amount: 300 },
                    { minCount: 20, amount: 200 },
                    { minCount: 5, amount: 100 },
                ],
            },
        },
    });
    console.log('✅ Platform config seeded');
    console.log('\n🚀 Seed complete!');
    console.log('   Super Admin → superadmin@banglapark.com / SuperAdmin@123');
    console.log('   Admin       → admin@banglapark.com / Admin@123');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map