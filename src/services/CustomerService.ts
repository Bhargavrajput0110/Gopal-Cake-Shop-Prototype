import { prisma } from '@/lib/prisma'
import { CustomerResponseDTO, CreateCustomerDTO } from '@/dtos/CustomerSchemas'

export class CustomerService {
  static async listCustomers(): Promise<CustomerResponseDTO[]> {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      totalOrders: c.totalOrders,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    }))
  }

  static async getCustomerById(id: string): Promise<CustomerResponseDTO | null> {
    const c = await prisma.customer.findUnique({ where: { id } })
    if (!c) return null

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      totalOrders: c.totalOrders,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    }
  }

  static async getCustomerByPhone(phone: string): Promise<CustomerResponseDTO | null> {
    const c = await prisma.customer.findUnique({ where: { phone } })
    if (!c) return null

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      totalOrders: c.totalOrders,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    }
  }

  static async createCustomer(data: CreateCustomerDTO): Promise<CustomerResponseDTO> {
    const c = await prisma.customer.create({ data })
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      totalOrders: c.totalOrders,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    }
  }

  static async updateCustomer(id: string, data: Partial<CreateCustomerDTO>): Promise<CustomerResponseDTO> {
    const c = await prisma.customer.update({ where: { id }, data })
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      totalOrders: c.totalOrders,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    }
  }
}
