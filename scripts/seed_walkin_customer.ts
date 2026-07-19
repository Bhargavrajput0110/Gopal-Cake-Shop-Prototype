import { prisma } from '../src/lib/prisma'

async function main() {
  const walkInEmail = 'walkin@gopalcakeshop.com'
  
  let walkIn = await prisma.customer.findFirst({
    where: { email: walkInEmail }
  })
  
  if (!walkIn) {
    walkIn = await prisma.customer.create({
      data: {
        name: 'Walk-in Customer',
        email: walkInEmail,
        phone: '0000000000',
        isActive: true,
      }
    })
    console.log(`Created Walk-in Customer with ID: ${walkIn.id}`)
  } else {
    console.log(`Walk-in Customer already exists with ID: ${walkIn.id}`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
