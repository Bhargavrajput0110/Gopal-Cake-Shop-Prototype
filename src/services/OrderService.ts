import { getIsolatedPrisma, prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import { CreateDraftOrderDTO, UpdateDraftOrderDTO, OrderResponseDTO, DriverOrderDTO } from '@/dtos/OrderSchemas'
import { Prisma } from '@prisma/client'
import { toBranchId } from '@/lib/branches'
import { FinancialService } from '@/services/FinancialService'


export class OrderService {
  static async listOrders(
    branchId: string | null,
    role: string | null,
    page: number = 1,
    limit: number = 20,
    filters?: { status?: string, branch?: string, driverId?: string, search?: string, startDate?: string, endDate?: string, sortField?: string, sortOrder?: string, dueSoon?: boolean, hasIssues?: boolean }
  ): Promise<{ data: OrderResponseDTO[], total: number }> {
    // For non-admin users, use their real DB branchId from session directly
    // (session branchId is the real Supabase CUID like cmswuiiun00031su3vfrn9eq5)
    // For admin filtering by the ?branch= query param, resolve alias -> real CUID
    const BRANCH_CUID_MAP: Record<string, string> = {
      'elora': 'cmswuiiun00031su3vfrn9eq5',
      'khanderao': 'cmswuiita00011su3977ajl1z',
      'varasiya': 'cmswuiiu000021su3kv1mr41f',
      'uma': 'uma',
    };
    const resolveToDbId = (id: string) => BRANCH_CUID_MAP[id] ?? id;

    const db = prisma
    const skip = (page - 1) * limit
    const whereClause: Prisma.OrderWhereInput = {}

    if (role && role.toUpperCase() !== 'ADMIN') {
      // withApiHandler converts the session CUID into a canonical short name (e.g. 'elora')
      // We must convert it back to the real DB CUID for the query
      whereClause.branchId = branchId ? resolveToDbId(branchId) : undefined;
    } else if (filters?.branch) {
      const canonical = toBranchId(filters.branch);
      whereClause.branchId = resolveToDbId(canonical);
    }

    if (filters?.driverId) {
      whereClause.driverId = filters.driverId
    }

    if (filters?.status) {
      const statuses = filters.status.split(',');
      if (statuses.length > 1) {
        whereClause.status = { in: statuses as any };
      } else {
        whereClause.status = statuses[0] as any;
      }
    }
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
    if (filters?.dueSoon) {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      whereClause.targetDate = {
        gte: now,
        lte: nextHour
      };
      // only active uncompleted orders
      whereClause.status = { in: ['NEW', 'WAITING_FOR_CHEF', 'CHEF_ACCEPTED', 'MAKING', 'DECORATING'] };
    }
    if (filters?.hasIssues) {
      // For now, let's say "issues" means customerNotes is not null, or some items have notes. 
      // Also we don't want completed orders.
      whereClause.status = { notIn: ['READY_FOR_PICKUP', 'PENDING_ASSIGNMENT', 'ASSIGNED_TO_DRIVER', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'COMPLETED', 'CANCELLED'] };
      // This is a naive approximation since Prisma doesn't easily let us filter by JSON properties inside a related model array in one query.
      // So we will just filter by customerNotes initially, and then maybe frontend can further filter.
      whereClause.customerNotes = { not: null };
    }
    
    const orderBy: Prisma.OrderOrderByWithRelationInput[] = [];
    if (filters?.sortField) {
      orderBy.push({ [filters.sortField]: filters.sortOrder === 'asc' ? 'asc' : 'desc' });
    } else {
      orderBy.push({ createdAt: 'desc' });
    }
    orderBy.push({ id: 'desc' });

    console.log(`[OrderService.listOrders] role=${role} branchId=${branchId} whereClause=${JSON.stringify(whereClause)}`)
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: true,
          items: { include: { media: true } },
          ledgerEntries: true,
          vendorTasks: { include: { vendor: true } },
          ingredientRequests: { include: { requestedBy: true } },
        }
      }),
      db.order.count({ where: whereClause }),
    ])
    console.log(`[OrderService.listOrders] total=${total} ordersCount=${orders.length}`)

    // Fetch product details from Supabase to merge with items
    const productIds = Array.from(new Set(orders.flatMap(o => o.items.map(i => (i as any).productId)).filter(Boolean)))
    
    let productMap = new Map<string, any>()
    try {
      if (productIds.length > 0) {
        const { data: products } = await supabaseAdmin.from('products').select('*').in('id', productIds)
        if (products) {
          productMap = new Map(products.map((p: any) => [p.id, p]))
        }
      }
    } catch (err) {
      console.error('[OrderService] Error fetching products from Supabase:', err)
    }

    return {
      data: await Promise.all(orders.map(async (o) => {
        const finSummary = await FinancialService.calculateFinancialSummary(o);
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customer?.name || 'Walk-in',
          customerPhone: o.customer?.phone || '',
          branch: o.branchId, // Use branchId directly or map to name
          status: o.status,
          orderType: o.deliveryType?.toLowerCase() || 'pickup',
          grandTotal: finSummary.totalAmount,
          timeTarget: o.targetDate,
          createdAt: o.createdAt,
          cakeImage: o.items[0]?.media?.find((m: any) => m.type === 'REFERENCE')?.url || o.items[0]?.image || undefined,
          items: o.items.map((i: any) => {
            const product = i.productId ? productMap.get(i.productId) : null;
            const referenceImages = i.media ? i.media.filter((m: any) => m.type === 'REFERENCE').map((m: any) => m.url) : [];
            const printImages = i.media ? i.media.filter((m: any) => m.type === 'PRODUCTION').map((m: any) => m.url) : [];
            return {
              id: i.id,
              name: i.productName || product?.name || 'Custom Item',
              productName: i.productName || product?.name || 'Custom Item',
              price: Number(i.price),
              qty: i.quantity,
              weight: i.weight ? `${i.weight}kg` : undefined,
              flavor: i.flavor || undefined,
              notes: i.notes || undefined,
              image: i.image || product?.thumbnail || undefined,
              referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
              printImages: printImages.length > 0 ? printImages : undefined,
            }
          }),
          priorityLevel: (o as any).priorityLevel || "normal",
          isSurprise: (o as any).isSurprise || false,
          customerInstructions: (o as any).customerNotes || undefined,
          pendingBalance: finSummary.outstandingAmount,
          advancePaid: finSummary.paidAmount,
          financialStatus: finSummary.paymentStatus,
          delayLevel: "none",
          vendorTasks: ((o as any).vendorTasks || []).map((vt: any) => ({
            id: vt.id,
            vendorId: vt.vendorId,
            vendorName: vt.vendor?.name,
            vendorType: vt.vendorType,
            status: vt.status.toLowerCase(),
            instructions: vt.instructions,
            notes: vt.notes || []
          })),
          ingredientRequests: ((o as any).ingredientRequests || []).map((ir: any) => ({
            id: ir.id,
            itemCode: ir.itemCode,
            itemName: ir.itemName,
            qty: ir.qty,
            unit: ir.unit,
            requestedBy: ir.requestedBy?.name || 'Chef',
            status: ir.status.toLowerCase(),
            timestamp: ir.createdAt
          })),
        } as any;
      })),
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
    const o = await db.order.findUnique({ 
      where: { id },
      include: { 
        ledgerEntries: true,
        vendorTasks: { include: { vendor: true } },
        ingredientRequests: { include: { requestedBy: true } },
      } 
    })
    if (!o) return null

    const finSummary = await FinancialService.calculateFinancialSummary(o);

    return {
      id: o.id,
      customerId: o.customerId,
      branchId: o.branchId,
      status: o.status,
      deliveryType: o.deliveryType,
      totalAmount: finSummary.totalAmount,
      advancePaid: finSummary.paidAmount,
      pendingBalance: finSummary.outstandingAmount,
      financialStatus: finSummary.paymentStatus,
      expectedDeliveryDate: o.targetDate,
      createdAt: o.createdAt,
      vendorTasks: ((o as any).vendorTasks || []).map((vt: any) => ({
        id: vt.id,
        vendorId: vt.vendorId,
        vendorName: vt.vendor?.name,
        vendorType: vt.vendorType,
        status: vt.status.toLowerCase(),
        instructions: vt.instructions,
        notes: vt.notes || []
      })),
      ingredientRequests: ((o as any).ingredientRequests || []).map((ir: any) => ({
        id: ir.id,
        itemCode: ir.itemCode,
        itemName: ir.itemName,
        qty: ir.qty,
        unit: ir.unit,
        requestedBy: ir.requestedBy?.name || 'Chef',
        status: ir.status.toLowerCase(),
        timestamp: ir.createdAt
      })),
    } as any
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

    return await Promise.all(orders.map(async o => {
      // Stub coords for V1 if not available
      const coords = null
      const finSummary = await FinancialService.calculateFinancialSummary(o);

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
        
        totalAmount: finSummary.totalAmount,
        paidAmount: finSummary.paidAmount,
        pendingBalance: finSummary.outstandingAmount,
        financialStatus: finSummary.paymentStatus,
        
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
    }))
  }
}
