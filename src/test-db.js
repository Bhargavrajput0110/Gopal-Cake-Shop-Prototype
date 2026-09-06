const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const d = await prisma.design.findFirst({ select: { name: true, recommendedWeight: true } });
    console.log(d);
}

main().finally(() => prisma.$disconnect());
