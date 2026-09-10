import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { getFlavourSurcharge } from '@/lib/flavours'
import {
  OrderSource,
  PaymentMethod,
  PaymentType,
  DeliveryType,
  PrismaClient,
  OrderStatus,
  OrderItemStatus,
  MediaType
} from '@prisma/client'
import { OutboxService } from '@/lib/events/OutboxService'
import { SettingsService } from '@/services/SettingsService'
import { toBranchId } from '@/lib/branches'
import { DistanceFactory } from '@/services/distance/DistanceFactory'

export interface CheckoutContext {
  source: OrderSource
  createdById?: string
  canOverridePrice?: boolean
  canOverrideDelivery?: boolean
  canOverrideDiscount?: boolean
  canAssignPriority?: boolean
}

export interface CheckoutItem {
  productId: string
  quantity: number
  weight: number
  flavor?: string
  messageOnCake?: string
  overridePrice?: number // Only valid if context.canOverridePrice is true
  
  // Custom Production Additions
  designId?: string
  designCode?: string
  designName?: string
  designImageUrl?: string
  shape?: string
  notes?: string
  boxCount?: number
  estimatedPrepMinutes?: number
  referenceImages?: string[]
}

export interface CheckoutPayload {
  customerId: string
  branchId: string
  items: CheckoutItem[]
  deliveryType: DeliveryType
  targetDate: string
  deliveryAddress?: string
  couponCode?: string
  overrideDeliveryCharge?: number // Only valid if context.canOverrideDelivery
  overrideDiscount?: number // Only valid if context.canOverrideDiscount
  isPriority?: boolean
  internalNotes?: string
  paymentMethod: PaymentMethod
  paymentType: PaymentType
  payments?: { method: PaymentMethod, amount: number }[]
  idempotencyKey?: string
  type?: 'ORDER' | 'QUOTE'
  isFarDistance?: boolean
  deliveryDistanceKm?: number
  deliveryLatitude?: number
  deliveryLongitude?: number
}

export class StorefrontEngine {
  /**
   * Calculates the delivery charge based on distance.
   *
   * Tier 1: 0 – 5 km   → ₹100 flat
   * Tier 2: 5 – 10 km  → ₹150 flat
   * Tier 3: > 10 km    → ₹150 base + ₹10 per km beyond 10 km (rounded up)
   *
   * @param distanceKm - Distance from branch to delivery address in km.
   * @returns Delivery charge in INR.
   */
  static calculateDistanceBasedDeliveryCharge(distanceKm: number): number {
    if (distanceKm <= 5) {
      return 100
    } else if (distanceKm <= 10) {
      return 150
    } else {
      const extraKm = Math.ceil(distanceKm - 10)
      return 150 + (extraKm * 10)
    }
  }

  /**
   * Processes a checkout request and creates an Order.
   * Enforces business rules based on the provided CheckoutContext.
   */
  static async processCheckout(context: CheckoutContext, payload: CheckoutPayload) {
    if (payload.items.length === 0) {
      throw new Error('Order must contain at least one item.')
    }

    // 1. Resolve Fulfillment Branch
    // BUSINESS RULE: All delivery orders are ALWAYS fulfilled from Uma Branch.
    // This is enforced server-side and cannot be overridden by the client.
    // For PICKUP orders, the customer-selected branch is used.
    let branch;
    if (payload.deliveryType === DeliveryType.DELIVERY) {
      // Enforce Uma as the fulfillment outlet — ignore whatever branchId the client sent
      branch = await prisma.branch.findFirst({
        where: { isActive: true, OR: [{ code: 'UMA' }, { name: { contains: 'Uma', mode: 'insensitive' } }] }
      })
      if (!branch) {
        throw new Error('Uma Branch (delivery fulfillment outlet) is not configured or inactive.')
      }
    } else {
      // First try to find by exact ID (if frontend sent a real CUID)
      branch = await prisma.branch.findUnique({ where: { id: payload.branchId } })
      
      if (!branch) {
        // Fallback: If it's an alias like "uma", parse it and lookup by code
        const parsedBranchCode = toBranchId(payload.branchId)
        branch = await prisma.branch.findFirst({
          where: { code: { equals: parsedBranchCode, mode: 'insensitive' } }
        })
      }
      
      if (!branch || !branch.isActive) {
        throw new Error('Selected pickup branch is invalid or inactive.')
      }
    }

    // Fetch Settings
    const gstRateStr = await SettingsService.getSettingValueByKey('GST_RATE', '0')
    const gstRate = parseFloat(gstRateStr) || 0
    const defaultDeliveryStr = await SettingsService.getSettingValueByKey('DELIVERY_CHARGE', '100')
    const defaultDeliveryCharge = parseFloat(defaultDeliveryStr) || 100
    const storeAcceptingOrders = await SettingsService.getSettingValueByKey('STORE_ACCEPTING_ORDERS', 'true')

    if (context.source === OrderSource.WEBSITE && storeAcceptingOrders !== 'true') {
      throw new Error('Store is currently not accepting orders.')
    }

    // 2. Validate Items & Pricing
    const productIds = payload.items.map(i => i.productId)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const designs = await prisma.design.findMany({ where: { id: { in: productIds } } })
    
    const allVendors = await prisma.user.findMany({
      where: { role: { in: ['VENDOR_FLORIST', 'VENDOR_PHOTO', 'VENDOR_ACRYLIC'] } }
    });

    let subtotal = 0
    let totalTax = 0
    const orderItemsData = payload.items.map(item => {
      let product = products.find(p => p.id === item.productId)
      const design = designs.find(d => d.id === item.productId)
      
      const isRealProduct = !!product;

      // MOCK product for designs and custom cakes
      if (!product && (design || item.designId || item.productId === 'custom-cake-studio' || item.productId.startsWith('custom-'))) {
         product = {
            id: item.productId,
            name: design?.name || item.designName || 'Custom Cake',
            basePrice: item.overridePrice || design?.basePrice || 0,
            weightConfig: design?.weightConfig || null,
            availableForSale: true,
            isArchived: false,
            thumbnail: design?.imageUrl || item.designImageUrl || null,
            requiredVendors: (item as any).requiredVendors || []
         } as any
      }

      if (!product || !product.availableForSale || product.isArchived) {
        console.error('[StorefrontEngine] Product Validation Failed!', {
          itemId: item.productId,
          foundProduct: !!product,
          availableForSale: product?.availableForSale,
          isArchived: product?.isArchived,
          cartItemContext: item
        });
        throw new Error(`Product ${item.productId} is not available.`)
      }

      // Base pricing logic
      let unitPrice = 0;
      let usedWeightConfig = false;
      
      if ((product as any).weightConfig) {
        try {
          const wc: any = typeof (product as any).weightConfig === 'string' ? JSON.parse((product as any).weightConfig) : (product as any).weightConfig;
          if (wc && typeof wc === 'object' && Object.keys(wc).length > 0) {
            const weightKey = item.weight.toString();
            if (wc[weightKey] && wc[weightKey].price) {
              unitPrice = Number(wc[weightKey].price);
              usedWeightConfig = true;
            }
          }
        } catch(e) {}
      }

      if (!usedWeightConfig) {
        // Tiered multiplier matching frontend
        const basePricesByWeight: Record<string, number> = {
          "0.25": 350, "0.5": 600, "0.75": 850, "1": 1100, "1.5": 1600,
          "2": 2100, "2.5": 2600, "3": 3000, "3.5": 3500, "4": 4000,
          "4.5": 4400, "5": 4800, "5.5": 5250, "6": 5700, "6.5": 6150,
          "7": 6600, "7.5": 7000, "8": 7450, "8.5": 7900, "9": 8300,
          "9.5": 8750, "10": 9200,
        };
        
        let scale = 1;
        const weightStr = item.weight.toString();
        if (basePricesByWeight[weightStr]) {
          scale = basePricesByWeight[weightStr] / 600; // 600 is the standard 0.5kg base
        } else {
          // Fallback linear scaling
          scale = item.weight / 0.5;
        }
        
        unitPrice = Number(product.basePrice) * scale;
      }

      // Add flavour surcharge
      if (item.flavor) {
        const surcharge = getFlavourSurcharge(item.flavor, item.weight)
        unitPrice += surcharge
      }

      // Apply override if permitted
      if (context.canOverridePrice && item.overridePrice !== undefined) {
        unitPrice = item.overridePrice
      }

      // If it's a Quote, line price should be 0 because the Sales team will set it later
      if (payload.type === 'QUOTE') {
        unitPrice = 0
      }

      const lineTotal = unitPrice * item.quantity
      subtotal += lineTotal
      
      // Calculate tax as INCLUSIVE (frontend prices already include tax)
      const lineTax = (lineTotal * gstRate) / (100 + gstRate)
      totalTax += lineTax

      // Generate Child Items for Vendors if product requires them
      const childItemsToCreate: any[] = []
      if (product.requiredVendors && product.requiredVendors.length > 0) {
        for (const vRole of product.requiredVendors) {
          const vendor = allVendors.find(v => v.role === vRole)
          childItemsToCreate.push({
            productName: `${vRole.replace('VENDOR_', '')} Component`,
            price: 0,
            quantity: item.quantity,
            weight: 0,
            status: OrderItemStatus.WAITING_FOR_CHEF, // Will be mapped to 'Pending' for vendors
            assignedVendorId: vendor ? vendor.id : null,
          })
        }
      }

      return {
        productId: isRealProduct ? product.id : undefined,
        productName: product.name,
        price: unitPrice,
        tax: lineTax,
        quantity: item.quantity,
        weight: item.weight,
        flavor: item.flavor,
        messageOnCake: item.messageOnCake,
        image: product.thumbnail,
        designId: design ? design.id : item.designId,
        designCode: design ? design.code : item.designCode,
        designName: design ? design.name : item.designName,
        designImageUrl: design ? design.imageUrl : item.designImageUrl,
        shape: item.shape,
        notes: item.notes,
        boxCount: item.boxCount || 1,
        status: payload.type === 'QUOTE' ? OrderItemStatus.PENDING : OrderItemStatus.WAITING_FOR_CHEF,
        estimatedPrepMinutes: item.estimatedPrepMinutes || 0,
        childItems: childItemsToCreate.length > 0 ? { create: childItemsToCreate } : undefined,
        media: item.referenceImages && item.referenceImages.length > 0 ? {
          create: item.referenceImages.map(url => ({
            type: MediaType.REFERENCE,
            url
          }))
        } : undefined
      }
    })

    // 3. Delivery & Distance Calculation
    let deliveryCharge = 0
    let calculatedDistanceKm: number | undefined = payload.deliveryDistanceKm;
    let calculatedIsFarDistance: boolean = payload.isFarDistance || false;

    if (payload.deliveryType === DeliveryType.DELIVERY) {
      // Staff override takes full priority — skip all distance logic
      if (context.canOverrideDelivery && payload.overrideDeliveryCharge !== undefined) {
        deliveryCharge = payload.overrideDeliveryCharge
      } else {
        // Try to calculate the real distance, then apply tiered pricing
        if (payload.deliveryAddress && branch.address) {
          try {
            const distanceProvider = DistanceFactory.getProvider();
            const distanceResult = await distanceProvider.calculateDistance(branch.address, payload.deliveryAddress);
            calculatedDistanceKm = distanceResult.distanceKm;
            calculatedIsFarDistance = distanceResult.isFarDistance;
          } catch (error) {
            console.error('[DistanceProvider] Failed to calculate distance:', error);
            // calculatedDistanceKm stays as client-provided value (or undefined)
          }
        }

        if (calculatedDistanceKm !== undefined) {
          // BUSINESS RULE: Delivery distance capped at 20km
          if (calculatedDistanceKm > 20) {
            throw new Error(`Delivery distance (${calculatedDistanceKm.toFixed(1)}km) exceeds 20km. For orders outside Vadodara, please contact Owner Rishi Bhai at +91 97126 32132 to proceed.`);
          }
          // Apply tiered distance-based pricing:
          // 0–5 km → ₹100 | 5–10 km → ₹150 | >10 km → ₹150 + ₹10/km beyond 10
          deliveryCharge = StorefrontEngine.calculateDistanceBasedDeliveryCharge(calculatedDistanceKm)
          console.log(`[DeliveryCharge] ${calculatedDistanceKm} km → ₹${deliveryCharge}`)
        } else {
          // No distance data available — fall back to the flat setting
          deliveryCharge = defaultDeliveryCharge
          console.warn('[DeliveryCharge] Distance unknown — using flat DELIVERY_CHARGE setting:', defaultDeliveryCharge)
        }
      }
    }

    // Force delivery charge to 0 for Quotes
    if (payload.type === 'QUOTE') {
      deliveryCharge = 0
    }

    // 4. Coupons & Discounts Calculation
    let discount = 0
    let couponId: string | undefined = undefined

    // Apply manual override first if permitted
    if (context.canOverrideDiscount && payload.overrideDiscount !== undefined) {
      discount = payload.overrideDiscount
    } else if (payload.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: payload.couponCode } })
      if (!coupon || !coupon.isActive) {
        throw new Error('Invalid or inactive coupon code.')
      }

      // Check min order value
      if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
        throw new Error(`Minimum order value for this coupon is ₹${coupon.minOrderValue}`)
      }

      // Apply discount
      if (coupon.discountType === 'PERCENTAGE') {
        let calcDiscount = (subtotal * Number(coupon.discountValue)) / 100
        if (coupon.maxDiscount && calcDiscount > Number(coupon.maxDiscount)) {
          calcDiscount = Number(coupon.maxDiscount)
        }
        discount = calcDiscount
      } else {
        discount = Number(coupon.discountValue)
      }
      couponId = coupon.id
    }

    // 5. Final Totals (Tax is inclusive, so we do not add totalTax to totalAmount)
    const totalAmount = subtotal + deliveryCharge - discount

    // 6. Idempotency Check
    if (payload.idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({ where: { idempotencyKey: payload.idempotencyKey } })
      if (existingOrder) {
        return existingOrder
      }
    }

    // 7. Transactional Order Creation
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
          trackingId: `GCS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          customerId: payload.customerId,
          branchId: branch.id,
          source: context.source,
          createdById: context.createdById,
          isPriority: context.canAssignPriority ? payload.isPriority : false,
          internalNotes: payload.internalNotes,
          type: payload.type || 'ORDER',
          status: payload.type === 'QUOTE' ? OrderStatus.QUOTE_DRAFT : (context.source === 'POS' ? OrderStatus.WAITING_FOR_CHEF : OrderStatus.NEW),
          deliveryType: payload.deliveryType,
          targetDate: new Date(payload.targetDate),
          deliveryAddress: payload.deliveryAddress,
          subtotal,
          deliveryCharge,
          discount,
          totalAmount,
          couponId,
          idempotencyKey: payload.idempotencyKey,
          isFarDistance: calculatedIsFarDistance,
          deliveryDistanceKm: calculatedDistanceKm,
          deliveryLatitude: payload.deliveryLatitude,
          deliveryLongitude: payload.deliveryLongitude,
          items: {
            create: orderItemsData
          },
          ...(() => {
            // Helper to determine if a payment should be instantly marked SUCCESS (and get a ledger entry)
            const getInitialStatus = (method: PaymentMethod): 'SUCCESS' | 'PENDING' => {
              if (context.source === 'POS') {
                if (method === 'CASH' || method === 'UPI' || method === 'CARD' || method === 'MANUAL') return 'SUCCESS';
                // Online gateways remain pending until webhook confirms
                return 'PENDING';
              }
              // Website, Admin, etc all start as pending
              return 'PENDING';
            };

            if (payload.payments && payload.payments.length > 0) {
              const paymentsData = payload.payments.map(p => {
                const status = getInitialStatus(p.method);
                return {
                  amount: p.amount,
                  method: p.method,
                  type: payload.paymentType,
                  status
                };
              });
              
              const ledgerEntriesData = paymentsData
                .filter(p => p.status === 'SUCCESS')
                .map(p => ({
                  amount: p.amount,
                  method: p.method,
                  type: 'PAYMENT' as const,
                  status: 'SUCCESS' as const,
                  actorId: context.createdById || null,
                  branchId: branch.id,
                  notes: `Initial payment at ${context.source}`
                }));

              return {
                payments: { create: paymentsData },
                ...(ledgerEntriesData.length > 0 ? { ledgerEntries: { create: ledgerEntriesData } } : {})
              };
            } else if (payload.paymentType === 'FULL') {
              const status = getInitialStatus(payload.paymentMethod);
              const paymentsData = {
                amount: totalAmount,
                method: payload.paymentMethod,
                type: 'FULL' as const,
                status
              };

              return {
                payments: { create: paymentsData },
                ...(status === 'SUCCESS' ? {
                  ledgerEntries: {
                    create: {
                      amount: totalAmount,
                      method: payload.paymentMethod,
                      type: 'PAYMENT' as const,
                      status: 'SUCCESS' as const,
                      actorId: context.createdById || null,
                      branchId: branch.id,
                      notes: `Full payment at ${context.source}`
                    }
                  }
                } : {})
              };
            }
            return {};
          })()
        },
        include: { items: true, customer: true, branch: true, payments: true }
      })

      // Update Coupon Usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } }
        })
      }

      // Record Timeline Event
      const isQuote = payload.type === 'QUOTE';
      await tx.timeline.create({
        data: {
          orderId: newOrder.id,
          action: isQuote ? 'QUOTE_CREATED' : 'CREATED_VIA_STOREFRONT',
          status: newOrder.status,
          nextState: newOrder.status,
          note: isQuote ? `Quote generated via ${context.source}` : `Order received via ${context.source}`,
        }
      })

      // Record Forensic AuditLog
      await tx.auditLog.create({
        data: {
          action: 'ORDER_CREATED',
          reason: `Order created via ${context.source}`,
          actorId: context.createdById || null,
          tableName: 'Order',
          recordId: newOrder.id,
          newValue: { status: newOrder.status, totalAmount: newOrder.totalAmount },
          oldValue: {}
        }
      })

      // Dispatch Integration Event (Outbox)
      await OutboxService.publish(
        'OrderCreatedEvent',
        newOrder.id,
        {
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          source: newOrder.source,
          totalAmount: newOrder.totalAmount
        },
        tx
      )

      return newOrder
    }, {
      maxWait: 15000,
      timeout: 30000
    })

    const io = (global as any).io;
    console.log('[DEBUG] StorefrontEngine io defined?', !!io);
    if (io && payload.type !== 'QUOTE') {
      io.to(`branch_${order.branchId}`).emit('order_created');
      io.to('admin_global').emit('order_created');

      if (order.isFarDistance) {
        const alertPayload = { 
          orderId: order.id, 
          orderNumber: order.orderNumber, 
          distanceKm: order.deliveryDistanceKm, 
          branchId: order.branchId 
        };
        // Emit to kitchen and delivery of that branch, plus global admins
        io.to(`branch_${order.branchId}_kitchen`).emit('far_distance_alert', alertPayload);
        io.to(`branch_${order.branchId}_delivery`).emit('far_distance_alert', alertPayload);
        io.to('admin_global').emit('far_distance_alert', alertPayload);
      }
    }

    return order
  }
}
