import { prisma } from '@/lib/prisma'
import { BranchResponseDTO, CreateBranchDTO } from '@/dtos/BranchSchemas'

export class BranchService {
  static async listBranches(includeInactive = true): Promise<BranchResponseDTO[]> {
    const branches = await prisma.branch.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    })

    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      address: b.address,
      phone: b.phone,
      isActive: b.isActive,
      deliveryEnabled: b.deliveryEnabled,
    }))
  }

  static async getBranchById(id: string): Promise<BranchResponseDTO | null> {
    const b = await prisma.branch.findUnique({ where: { id } })
    if (!b) return null

    return {
      id: b.id,
      name: b.name,
      code: b.code,
      address: b.address,
      phone: b.phone,
      isActive: b.isActive,
      deliveryEnabled: b.deliveryEnabled,
    }
  }

  static async createBranch(data: CreateBranchDTO): Promise<BranchResponseDTO> {
    const b = await prisma.branch.create({ data })
    return {
      id: b.id,
      name: b.name,
      code: b.code,
      address: b.address,
      phone: b.phone,
      isActive: b.isActive,
      deliveryEnabled: b.deliveryEnabled,
    }
  }

  static async updateBranch(id: string, data: Partial<CreateBranchDTO>): Promise<BranchResponseDTO> {
    const b = await prisma.branch.update({ where: { id }, data })
    return {
      id: b.id,
      name: b.name,
      code: b.code,
      address: b.address,
      phone: b.phone,
      isActive: b.isActive,
      deliveryEnabled: b.deliveryEnabled,
    }
  }

  static async deleteBranch(id: string): Promise<void> {
    await prisma.branch.delete({ where: { id } })
  }
}
