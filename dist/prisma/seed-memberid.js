"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true } });
    for (let i = 0; i < users.length; i++) {
        await prisma.user.update({ where: { id: users[i].id }, data: { memberId: 101 + i } });
    }
    console.log('Seeded memberIds for ' + users.length + ' users');
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-memberid.js.map