const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkKapil() {
  const user = await prisma.user.findUnique({
    where: { id: 'cmswuijeh000t1su3btlv1dk0' }
  });
  console.log("User:", user);
  if (user) {
    const isValid = await bcrypt.compare("8045", user.passwordHash);
    console.log("PIN 8045 matches:", isValid);
  }
}
checkKapil();
