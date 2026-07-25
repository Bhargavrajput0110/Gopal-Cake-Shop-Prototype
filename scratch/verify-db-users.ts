import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('=== INSPECTING DB USERS & PINS ===')
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, branchId: true, passwordHash: true }
  })

  console.log(`Found ${users.length} users in DB:\n`)

  for (const u of users) {
    const pin1111 = u.passwordHash ? await bcrypt.compare('1111', u.passwordHash) : false
    const pin1234 = u.passwordHash ? await bcrypt.compare('1234', u.passwordHash) : false
    const pin0000 = u.passwordHash ? await bcrypt.compare('0000', u.passwordHash) : false
    const pin2222 = u.passwordHash ? await bcrypt.compare('2222', u.passwordHash) : false
    const pin3333 = u.passwordHash ? await bcrypt.compare('3333', u.passwordHash) : false
    const pin4444 = u.passwordHash ? await bcrypt.compare('4444', u.passwordHash) : false

    let matchedPin = 'NONE'
    if (pin1111) matchedPin = '1111'
    if (pin1234) matchedPin = '1234'
    if (pin0000) matchedPin = '0000'
    if (pin2222) matchedPin = '2222'
    if (pin3333) matchedPin = '3333'
    if (pin4444) matchedPin = '4444'

    console.log(`User: ${u.name} (id: ${u.id}, role: ${u.role}, branchId: ${u.branchId}) -> Valid PIN: [${matchedPin}]`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
