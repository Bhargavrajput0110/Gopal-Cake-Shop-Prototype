require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetKapil() {
  try {
    const kapil = await prisma.user.findFirst({
      where: { name: { contains: 'Kapil' } }
    });
    if (!kapil) {
      console.log('Kapil not found in database!');
      return;
    }
    
    console.log('Found user:', kapil.name, kapil.username, kapil.email);
    
    const hash = await bcrypt.hash('8045', 10);
    const updated = await prisma.user.update({
      where: { id: kapil.id },
      data: { passwordHash: hash }
    });
    
    console.log('Successfully reset password for', updated.username, 'to 8045');
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetKapil();
