import { prisma } from './src/lib/prisma';
prisma.orderItem.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, productName: true, flavor: true } }).then(console.log).finally(() => prisma.$disconnect());
