import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ── Super Admin ──
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

    // ── Admin ──
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

    // ── Regular User ──
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

    // ── Sample Products (uncategorized) ──
    const products = [
        { name: 'Multipurpose Tote Bag', slug: 'multipurpose-tote-bag', description: 'Eco-friendly reusable shopping tote bag.', price: 450, stock: 300, categoryId: null, images: [] },
        { name: 'Handmade Scented Candle Set', slug: 'handmade-scented-candle-set', description: 'Set of 3 handmade soy wax candles.', price: 650, stock: 120, categoryId: null, images: [] },
        { name: 'Bamboo Toothbrush Pack', slug: 'bamboo-toothbrush-pack', description: 'Pack of 4 eco-friendly bamboo toothbrushes.', price: 350, stock: 500, categoryId: null, images: [] },
        { name: 'Organic Green Tea', slug: 'organic-green-tea', description: 'Premium organic green tea leaves 200g.', price: 550, stock: 250, categoryId: null, images: [] },
        { name: 'Cotton Bed Sheet Set', slug: 'cotton-bed-sheet-set', description: 'Soft cotton bed sheet set, twin size.', price: 1200, stock: 80, categoryId: null, images: [] },
        { name: 'Stainless Steel Water Bottle', slug: 'stainless-water-bottle', description: 'Double-wall insulated 750ml bottle.', price: 850, stock: 200, categoryId: null, images: [] },
        { name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', description: 'Non-slip thick yoga mat with carry strap.', price: 1100, stock: 150, categoryId: null, images: [] },
        { name: 'LED Desk Lamp', slug: 'led-desk-lamp', description: 'Adjustable LED desk lamp with USB port.', price: 950, stock: 100, categoryId: null, images: [] },
        { name: 'Natural Honey Jar', slug: 'natural-honey-jar', description: 'Pure raw honey 500g, no additives.', price: 750, stock: 300, categoryId: null, images: [] },
        { name: 'Canvas Backpack', slug: 'canvas-backpack', description: 'Vintage-style canvas backpack, 25L capacity.', price: 1400, stock: 90, categoryId: null, images: [] },
        { name: 'Scented Soy Wax Candle', slug: 'scented-soy-wax-candle', description: 'Long-burning soy wax candle, vanilla scent.', price: 480, stock: 180, categoryId: null, images: [] },
        { name: 'Wireless Bluetooth Earbuds', slug: 'wireless-bluetooth-earbuds', description: 'True wireless earbuds with charging case.', price: 1600, stock: 60, categoryId: null, images: [] },
        { name: 'Jute Grocery Bag Set', slug: 'jute-grocery-bag-set', description: 'Set of 3 jute bags for eco-friendly shopping.', price: 320, stock: 400, categoryId: null, images: [] },
        { name: 'Aromatic Essential Oil Kit', slug: 'aromatic-essential-oil-kit', description: 'Set of 6 essential oils with diffuser.', price: 2100, stock: 70, categoryId: null, images: [] },
        { name: 'Copper Water Bottle', slug: 'copper-water-bottle', description: 'Pure copper water bottle, 1 liter.', price: 980, stock: 130, categoryId: null, images: [] },
        { name: 'Planner & Journal Combo', slug: 'planner-journal-combo', description: 'Daily planner + dotted journal, hardcover.', price: 580, stock: 220, categoryId: null, images: [] },
        { name: 'Resistance Band Set', slug: 'resistance-band-set', description: 'Set of 5 resistance bands with door anchor.', price: 720, stock: 160, categoryId: null, images: [] },
        { name: 'Ceramic Coffee Mug Set', slug: 'ceramic-coffee-mug-set', description: 'Set of 4 ceramic mugs, 350ml each.', price: 890, stock: 110, categoryId: null, images: [] },
        { name: 'Portable Power Bank', slug: 'portable-power-bank', description: '10000mAh power bank with dual USB output.', price: 1300, stock: 85, categoryId: null, images: [] },
        { name: 'Wooden Phone Stand', slug: 'wooden-phone-stand', description: 'Handcrafted bamboo phone stand, universal fit.', price: 250, stock: 350, categoryId: null, images: [] },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { slug: product.slug },
            update: {},
            create: product,
        });
    }
    console.log(`✅ ${products.length} sample products created`);

    // ── Platform Config ──
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

    // ── Sample Banners ──
    const sampleBanners = [
        {
            imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop',
            linkUrl: '/shop',
            isActive: true,
            sortOrder: 0,
        },
        {
            imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&h=600&fit=crop',
            linkUrl: '/register',
            isActive: true,
            sortOrder: 1,
        },
        {
            imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&h=600&fit=crop',
            linkUrl: '/shop',
            isActive: true,
            sortOrder: 2,
        },
    ];

    for (const banner of sampleBanners) {
        await prisma.banner.create({ data: banner });
    }
    console.log(`✅ ${sampleBanners.length} sample banners created`);

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
