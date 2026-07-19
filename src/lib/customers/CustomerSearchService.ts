import { prisma } from '@/lib/prisma'
import { Customer } from '@prisma/client'

export interface CustomerSearchParams {
  phone: string
  name?: string
  email?: string
  address?: string
}

export class CustomerSearchService {
  /**
   * Finds a customer by phone number, or creates a new one if not found.
   * If found and name/email/address are provided, it optionally updates the customer.
   */
  static async resolveCustomer(params: CustomerSearchParams): Promise<Customer> {
    const { phone, name, email, address } = params
    
    // Normalize phone number (strip spaces/dashes)
    const normalizedPhone = phone.replace(/\D/g, '')

    if (!normalizedPhone) {
      throw new Error('Valid phone number is required to resolve a customer.')
    }

    let customer = await prisma.customer.findUnique({
      where: { phone: normalizedPhone }
    })

    if (!customer) {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          phone: normalizedPhone,
          name: name || 'Guest Customer',
          email: email || null,
          address: address || null,
        }
      })
    } else {
      // Optional: Update existing customer if new details are provided and missing
      const updates: any = {}
      if (name && customer.name === 'Guest Customer') updates.name = name
      if (email && !customer.email) updates.email = email
      if (address && !customer.address) updates.address = address

      if (Object.keys(updates).length > 0) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: updates
        })
      }
    }

    return customer
  }

  /**
   * Searches customers by partial name or phone number for auto-complete.
   */
  static async search(query: string, limit: number = 10): Promise<Customer[]> {
    if (!query || query.length < 3) return []

    return prisma.customer.findMany({
      where: {
        OR: [
          { phone: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: limit,
      orderBy: { totalOrders: 'desc' }
    })
  }
}
