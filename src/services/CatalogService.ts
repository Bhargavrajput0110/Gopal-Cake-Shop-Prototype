import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class CatalogService {
  /**
   * Fetch all categories (optimized for 150+ items).
   * Usually cached or fetched with a simple list.
   */
  static async listCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
  }

  static async createCategory(data: { name: string; slug: string; description?: string; displayOrder?: number; isActive?: boolean }) {
    return prisma.category.create({ data })
  }

  static async updateCategory(slugOrId: string, data: { name?: string; slug?: string; description?: string; displayOrder?: number; isActive?: boolean; currentUpdatedAt?: Date }) {
    const isCuid = slugOrId.length >= 25 // basic check
    const where = isCuid ? { id: slugOrId } : { slug: slugOrId }
    
    if (data.currentUpdatedAt) {
      const existing = await prisma.category.findUnique({ where })
      if (!existing) throw new Error('NOT_FOUND')
      if (existing.updatedAt.getTime() !== new Date(data.currentUpdatedAt).getTime()) {
        const error = new Error('CONCURRENCY_CONFLICT')
        ;(error as any).code = 'CONCURRENCY_CONFLICT'
        throw error
      }
    }
    
    // Remove currentUpdatedAt so it doesn't get passed to Prisma data
    const { currentUpdatedAt, ...updateData } = data;
    
    return prisma.category.update({ 
      where, 
      data: updateData 
    })
  }

  static async deleteCategory(slugOrId: string) {
    const isCuid = slugOrId.length >= 25
    const where = isCuid ? { id: slugOrId } : { slug: slugOrId }
    
    const category = await prisma.category.findUnique({ where, select: { id: true } })
    if (!category) return;
    
    const productsCount = await prisma.product.count({
      where: { categoryId: category.id }
    });
    
    if (productsCount > 0) {
      const error = new Error('CATEGORY_HAS_PRODUCTS');
      (error as any).code = 'CATEGORY_HAS_PRODUCTS';
      throw error;
    }

    return prisma.category.delete({ where })
  }

  /**
   * Fetch products with server-side pagination, search, and category filtering.
   */
  static async listProducts(params: {
    search?: string
    categoryId?: string
    isArchived?: boolean
    page?: number
    limit?: number
  }) {
    const { search, categoryId, isArchived = false, page = 1, limit = 50 } = params
    const skip = (page - 1) * limit

    const where: Prisma.ProductWhereInput = {
      isArchived
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  static async createProduct(data: Prisma.ProductUncheckedCreateInput, adminId?: string) {
    try {
      const product = await prisma.product.create({ data, include: { category: true } })
      
      await prisma.productHistory.create({
        data: {
          productId: product.id,
          changedBy: adminId || 'SYSTEM',
          changeType: 'CREATE',
          oldData: {},
          newData: JSON.parse(JSON.stringify(product))
        }
      })

      return product
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('sku')) {
        const error = new Error("A product with this SKU already exists.");
        (error as any).code = 'DUPLICATE_SKU';
        throw error;
      }
      throw e;
    }
  }

  static async updateProduct(id: string, data: Prisma.ProductUncheckedUpdateInput & { currentUpdatedAt?: Date | string }, adminId?: string) {
    const { currentUpdatedAt, ...updateData } = data;
    const oldProduct = await prisma.product.findUnique({ where: { id } })
    
    if (!oldProduct) throw new Error("Product not found");

    if (currentUpdatedAt) {
      const oldTime = new Date(oldProduct.updatedAt).getTime();
      const newTime = new Date(currentUpdatedAt).getTime();
      if (oldTime !== newTime) {
        const error = new Error("Product was modified by another user.");
        (error as any).code = 'CONCURRENCY_CONFLICT';
        throw error;
      }
    }

    try {
      const updatedProduct = await prisma.product.update({ where: { id }, data: updateData, include: { category: true } })

      if (oldProduct) {
        await prisma.productHistory.create({
          data: {
            productId: id,
            changedBy: adminId || 'SYSTEM',
            changeType: 'UPDATE',
            oldData: JSON.parse(JSON.stringify(oldProduct)),
            newData: JSON.parse(JSON.stringify(updatedProduct))
          }
        })
      }

      return updatedProduct
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('sku')) {
        const error = new Error("A product with this SKU already exists.");
        (error as any).code = 'DUPLICATE_SKU';
        throw error;
      }
      throw e;
    }
  }

  static async cloneProduct(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) throw new Error("Product not found")

    // Remove immutable fields to create a clone
    const { id: _, createdAt, updatedAt, name, ...rest } = existing

    const cloned = await prisma.product.create({
      data: {
        ...rest,
        weightVariants: rest.weightVariants === null ? undefined : rest.weightVariants,
        name: `${name} (Copy)`,
        availableForSale: false // safety net
      },
      include: { category: true }
    })

    await prisma.productHistory.create({
      data: {
        productId: cloned.id,
        changedBy: 'SYSTEM',
        changeType: 'CLONE',
        oldData: {},
        newData: JSON.parse(JSON.stringify(cloned))
      }
    })

    return cloned
  }

  static async bulkUpdatePrices(updates: { id: string; newPrice: number }[], adminId?: string) {
    // We update one by one to capture history properly
    const results = []
    for (const u of updates) {
      const oldProduct = await prisma.product.findUnique({ where: { id: u.id } })
      if (!oldProduct) continue

      const updated = await prisma.product.update({
        where: { id: u.id },
        data: { basePrice: u.newPrice }
      })

      await prisma.productHistory.create({
        data: {
          productId: u.id,
          changedBy: adminId || 'SYSTEM',
          changeType: 'PRICE_CHANGE',
          oldData: JSON.parse(JSON.stringify(oldProduct)),
          newData: JSON.parse(JSON.stringify(updated))
        }
      })
      results.push(updated)
    }
    return results
  }
}
