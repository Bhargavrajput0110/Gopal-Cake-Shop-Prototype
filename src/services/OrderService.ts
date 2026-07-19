import { getIsolatedPrisma, prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import { CreateDraftOrderDTO, UpdateDraftOrderDTO, OrderResponseDTO, DriverOrderDTO } from '@/dtos/OrderSchemas'
import { Prisma } from '@prisma/client'
import { toBranchId } from '@/lib/branches'

export class OrderService {
  static async listOrders(
    branchId: string | null,
    role: string | null,
    page: number = 1,
    limit: number = 20,
    filters?: { status?: string, branch?: string, search?: string, startDate?: string, endDate?: string, sortField?: string, sortOrder?: string }
  ): Promise<{ data: OrderResponseDTO[], total: number }> {
    const canonicalBranchId = branchId ? toBranchId(branchId) : null;
    const db = getIsolatedPrisma(canonicalBranchId, role)
    const skip = (page - 1) * limit
    
    const whereClause: Prisma.OrderWhereInput = {}
    if (filters?.status) {
      const statuses = filters.status.split(',');
      if (statuses.length > 1) {
        whereClause.status = { in: statuses as any };
      } else {
        whereClause.status = statuses[0] as any;
      }
    }
    if (filters?.branch) whereClause.branchId = toBranchId(filters.branch)
    if (filters?.search) {
      whereClause.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
        { customer: { phone: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }
    if (filters?.startDate || filters?.endDate) {
      whereClause.targetDate = {}
      if (filters?.startDate) {
        whereClause.targetDate.gte = new Date(filters.startDate)
      }
      if (filters?.endDate) {
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        whereClause.targetDate.lte = end
      }
    }
    
    const orderBy: Prisma.OrderOrderByWithRelationInput[] = [];
    if (filters?.sortField) {
      orderBy.push({ [filters.sortField]: filters.sortOrder === 'asc' ? 'asc' : 'desc' });
    } else {
      orderBy.push({ createdAt: 'desc' });
    }
    orderBy.push({ id: 'desc' });

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: true,
          items: true,
        }
      }),
      db.order.count({ where: whereClause }),
    ])

    // Fetch product details from Supabase to merge with items
    const productIds = Array.from(new Set(orders.flatMap(o => o.items.map(i => (i as any).productId)).filter(Boolean)))
    
    let productMap = new Map<string, any>()
    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin.from('products').select('*').in('id', productIds)
      if (products) {
        productMap = new Map(products.map((p: any) => [p.id, p]))
      }
    }

    return {
      data: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer?.name || 'Walk-in',
        customerPhone: o.customer?.phone || '',
        branch: o.branchId, // Use branchId directly or map to name
        status: o.status,
        orderType: o.deliveryType?.toLowerCase() || 'pickup',
        grandTotal: Number(o.totalAmount),
        timeTarget: o.targetDate,
        createdAt: o.createdAt,
        items: o.items.map((i: any) => {
          const product = i.productId ? productMap.get(i.productId) : null;
          return {
            id: i.id,
            productName: i.productName || product?.name || 'Custom Item',
            price: Number(i.price),
            qty: i.quantity,
            weight: i.weight ? `${i.weight}kg` : undefined,
          }
        }),
        priorityLevel: (o as any).priorityLevel || "normal",
        isSurprise: (o as any).isSurprise || false,
        customerInstructions: (o as any).customerNotes || undefined,
        pendingBalance: Number(o.totalAmount) - Number((o as any).advancePaid || 0),
        advancePaid: Number((o as any).advancePaid || 0),
        delayLevel: "none",
      })) as any,
      total,
    }
  }



  static async getOrderById(
    id: string,
    branchId: string | null,
    role: string | null
  ): Promise<OrderResponseDTO | null> {
    const canonicalBranchId = branchId ? toBranchId(branchId) : null;
    const db = getIsolatedPrisma(canonicalBranchId, role)
    const o = await db.order.findUnique({ where: { id } })
    if (!o) return null

    return {
      id: o.id,
      customerId: o.customerId,
      branchId: o.branchId,
      status: o.status,
      deliveryType: o.deliveryType,
      totalAmount: Number(o.totalAmount),
      expectedDeliveryDate: o.targetDate,
      createdAt: o.createdAt,
    }
  }

  static async createDraftOrder(
    data: CreateDraftOrderDTO,
    branchId: string | null,
    role: string | null
  ): Promise<OrderResponseDTO> {
    const canonicalBranchId = branchId ? toBranchId(branchId) : null;
    const db = getIsolatedPrisma(canonicalBranchId, role)
    // NOTE: This creates a basic draft order with no workflows.
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    const expectedDeliveryDate = new Date(data.expectedDeliveryDate)
    const o = await db.order.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        branchId: toBranchId(data.branchId),
        deliveryType: data.deliveryType as any,
        targetDate: expectedDeliveryDate,
        customerNotes: data.notes,
        status: 'DRAFT',
        subtotal: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(0),
      },
    })

    return {
      id: o.id,
      customerId: o.customerId,
      branchId: o.branchId,
      status: o.status,
      deliveryType: o.deliveryType,
      totalAmount: Number(o.totalAmount),
      expectedDeliveryDate: o.targetDate,
      createdAt: o.createdAt,
    }
  }

  static async updateDraftOrder(
    id: string,
    data: UpdateDraftOrderDTO,
    branchId: string | null,
    role: string | null
  ): Promise<OrderResponseDTO> {
    const canonicalBranchId = branchId ? toBranchId(branchId) : null;
    const db = getIsolatedPrisma(canonicalBranchId, role)
    const o = await db.order.update({
      where: { id },
      data: {
        customerId: data.customerId,
        branchId: data.branchId ? toBranchId(data.branchId) : undefined,
        deliveryType: data.deliveryType as any,
        targetDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
        customerNotes: data.notes,
      },
    })

    return {
      id: o.id,
      customerId: o.customerId,
      branchId: o.branchId,
      status: o.status,
      deliveryType: o.deliveryType,
      totalAmount: Number(o.totalAmount),
      expectedDeliveryDate: o.targetDate,
      createdAt: o.createdAt,
    }
  }

  static async deleteDraftOrder(
    id: string,
    branchId: string | null,
    role: string | null
  ): Promise<void> {
    const canonicalBranchId = branchId ? toBranchId(branchId) : null;
    const db = getIsolatedPrisma(canonicalBranchId, role)
    
    // In Phase 1 we established Orders are rarely deleted.
    // If we must delete a draft, we can physically delete it, or soft delete.
    // For now, physical delete of DRAFT only.
    const existing = await db.order.findUnique({ where: { id } })
    if (existing?.status !== 'DRAFT') {
      throw new Error('Only DRAFT orders can be deleted')
    }

  }

  /**
   * Fetches orders tailored for the Driver App.
   * Includes READY_FOR_PICKUP (Open Pool) and assigned jobs (PICKED_UP, ON_THE_WAY).
   */
  static async listDriverOrders(branchId: string, driverId: string, appRole: string): Promise<DriverOrderDTO[]> {
    // RBAC: Guard
    if (appRole !== 'ADMIN' && appRole !== 'MANAGER' && appRole !== 'DRIVER') {
      throw new Error("Unauthorized to access driver pool.")
    }

    const canonicalBranchId = toBranchId(branchId);

    const orders = await prisma.order.findMany({
      where: {
        branchId: canonicalBranchId,
        // Open pool OR my assigned jobs
        OR: [
          { status: 'READY' },
          { 
            driverId: driverId, 
            status: { in: ['READY', 'OUT_FOR_DELIVERY'] } 
          }
        ],
        // Safety: only show delivery types
        deliveryType: 'DELIVERY'
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true,
        ledgerEntries: true
      },
      orderBy: {
        targetDate: 'asc'
      }
    })

    return orders.map(o => {
      // Stub coords for V1 if not available
      const coords = null

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        deliveryType: o.deliveryType,
        targetDate: o.targetDate,
        createdAt: o.createdAt,
        notes: o.customerNotes,
        
        assignedDriverId: o.driverId,
        timeTarget: o.targetDate,
        pickedUpAt: (o as any).pickedUpAt || null, // Extend Prisma schema later if missing
        deliveredAt: (o as any).deliveredAt || null,
        
        totalAmount: Number(o.totalAmount),
        paidAmount: (o as any).ledgerEntries
          ?.filter((le: any) => le.type === 'PAYMENT' && le.status === 'SUCCESS')
          .reduce((sum: number, le: any) => sum + Number(le.amount), 0) || 0,
        
        formattedAddress: o.deliveryAddress || null,
        coordinates: coords,

        customer: o.customer ? {
          name: o.customer.name,
          phone: o.customer.phone
        } : null,

        items: o.items.map((i: any) => ({
          id: i.id,
          quantity: i.quantity,
          productName: i.productName || i.product?.name || 'Unknown Product',
          flavor: i.flavor || null,
          boxCount: i.boxCount || 1,
          status: i.status || 'PENDING'
        }))
      }
    })
  }
}
