import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class DesignService {
  /**
   * Fetch designs with server-side pagination and faceted search.
   */
  static async listDesigns(params: {
    search?: string
    categoryId?: string
    occasions?: string[]
    themes?: string[]
    characters?: string[]
    colours?: string[]
    shapes?: string[]
    styles?: string[]
    labels?: string[]
    status?: string[]
    page?: number
    limit?: number
  }) {
    const { 
      search, categoryId, 
      occasions, themes, characters, colours, shapes, styles, labels,
      status = ['ACTIVE'], page = 1, limit = 50 
    } = params

    const skip = (page - 1) * limit
    const where: Prisma.DesignWhereInput = { status: { in: status } }

    if (search) {
      // Natural search: tokenize by space
      const tokens = search.split(/\s+/).filter(t => t.length > 1)
      if (tokens.length > 0) {
        where.AND = tokens.map(token => ({
          OR: [
            { name: { contains: token, mode: 'insensitive' } },
            { code: { contains: token, mode: 'insensitive' } },
            { description: { contains: token, mode: 'insensitive' } },
            { tags: { hasSome: [token] } },
            { themes: { hasSome: [token] } },
            { characters: { hasSome: [token] } },
            { colours: { hasSome: [token] } },
            { occasions: { hasSome: [token] } },
            { styles: { hasSome: [token] } }
          ]
        }))
      }
    }

    if (categoryId && categoryId !== 'all') {
      where.categories = {
        some: { categoryId }
      }
    }

    if (occasions && occasions.length > 0) where.occasions = { hasSome: occasions }
    if (themes && themes.length > 0) where.themes = { hasSome: themes }
    if (characters && characters.length > 0) where.characters = { hasSome: characters }
    if (colours && colours.length > 0) where.colours = { hasSome: colours }
    if (shapes && shapes.length > 0) where.shapes = { hasSome: shapes }
    if (styles && styles.length > 0) where.styles = { hasSome: styles }
    if (labels && labels.length > 0) where.labels = { hasSome: labels }

    const [items, total] = await Promise.all([
      prisma.design.findMany({
        where,
        skip,
        take: limit,
        include: { categories: { include: { category: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.design.count({ where })
    ])

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  static async createDesign(data: Prisma.DesignCreateInput) {
    let finalCode = data.code
    
    // Auto generate DSP-XXXXXX code if not provided or empty
    if (!finalCode) {
      // Get the highest current DSP code
      const lastDesign = await prisma.design.findFirst({
        where: { code: { startsWith: 'DSP-' } },
        orderBy: { code: 'desc' }
      })
      
      let nextNumber = 1
      if (lastDesign && lastDesign.code) {
        const match = lastDesign.code.match(/DSP-(\d+)/)
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1
        }
      }
      finalCode = `DSP-${nextNumber.toString().padStart(6, '0')}`
    }

    return prisma.design.create({
      data: {
        ...data,
        code: finalCode
      },
      include: { categories: { include: { category: true } } }
    })
  }

  static async updateDesign(id: string, data: Prisma.DesignUpdateInput, currentUpdatedAt?: Date | string) {
    if (currentUpdatedAt) {
      const existing = await prisma.design.findUnique({ where: { id }, select: { updatedAt: true } })
      if (!existing) throw new Error('Design not found')
      
      const existingTime = existing.updatedAt.getTime()
      const providedTime = new Date(currentUpdatedAt).getTime()
      
      // Allow a small grace period for DB truncation differences
      if (Math.abs(existingTime - providedTime) > 1000) {
        throw new Error('CONCURRENCY_CONFLICT')
      }
    }

    return prisma.design.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 }
      },
      include: { categories: { include: { category: true } } }
    })
  }

  static async archiveDesign(id: string) {
    return prisma.design.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    })
  }

  static async restoreDesign(id: string) {
    return prisma.design.update({
      where: { id },
      data: { status: 'ACTIVE' }
    })
  }

  static async getRelatedDesigns(id: string, limit = 5) {
    const design = await prisma.design.findUnique({ where: { id } })
    if (!design) return []

    // Build OR condition to match overlapping tags/metadata
    const orConditions: any[] = []
    
    if (design.themes.length) orConditions.push({ themes: { hasSome: design.themes } })
    if (design.characters.length) orConditions.push({ characters: { hasSome: design.characters } })
    if (design.colours.length) orConditions.push({ colours: { hasSome: design.colours } })
    if (design.styles.length) orConditions.push({ styles: { hasSome: design.styles } })

    if (orConditions.length === 0) return []

    return prisma.design.findMany({
      where: {
        id: { not: id },
        status: 'ACTIVE',
        OR: orConditions
      },
      take: limit,
      include: { categories: { include: { category: true } } }
    })
  }
}
