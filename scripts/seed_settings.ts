import { getIsolatedPrisma } from '../src/lib/prisma'
import 'dotenv/config'

async function main() {
  const db = getIsolatedPrisma('System', 'ADMIN')
  const existing = await db.settings.findUnique({ where: { key: 'packing_checklist' } })
  if (!existing) {
    await db.settings.create({
      data: {
        key: 'packing_checklist',
        value: JSON.stringify([
          { id: 'cake', label: 'Cake' },
          { id: 'knife', label: 'Knife' },
          { id: 'candles', label: 'Candles' },
          { id: 'bill', label: 'Bill' },
          { id: 'tissue', label: 'Tissue' }
        ])
      }
    })
    console.log('Created default packing_checklist setting')
  } else {
    console.log('packing_checklist setting already exists')
  }
}

main()
  .catch(console.error)
