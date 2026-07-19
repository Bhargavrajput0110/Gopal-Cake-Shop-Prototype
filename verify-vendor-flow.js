require('dotenv').config({ path: '.env.local' }); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function run() { console.log('Prisma loaded'); } run();
