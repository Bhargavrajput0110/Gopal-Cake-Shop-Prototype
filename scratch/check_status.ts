import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
prisma.order.findUnique({where: {orderNumber: '001-0007'}}).then(o => console.log('STATUS:', o?.status, 'PAID_AMOUNT:', o?.cashCollectedAmount)).finally(() => prisma.$disconnect());
