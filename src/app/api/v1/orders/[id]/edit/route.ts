import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TimelineEventType } from '@prisma/client'
import { TimelineService } from '@/services/TimelineService'

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !session.user || !['ADMIN', 'MANAGER', 'SALESPERSON'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const updates = await req.json()
    
    const existingOrder = await prisma.order.findUnique({ 
      where: { id },
      include: { customer: true, items: { include: { media: true } } }
    })
    
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const lockedStatuses = ['CHEF_ACCEPTED','MAKING','DECORATING','READY_FOR_PICKUP','PENDING_ASSIGNMENT','ASSIGNED_TO_DRIVER','PICKED_UP','ON_THE_WAY','DELIVERED','COMPLETED','CANCELLED'];
    if (lockedStatuses.includes(existingOrder.status)) {
      return NextResponse.json({ error: 'Order is locked and cannot be edited. A chef has already accepted it.' }, { status: 400 })
    }

    // Determine what changed for the Audit Log
    const changes: any = {}
    
    if (updates.customerInstructions !== undefined && updates.customerInstructions !== existingOrder.customerNotes) {
      changes.customerNotes = { old: existingOrder.customerNotes, new: updates.customerInstructions }
    }
    
    if (updates.timeTarget !== undefined && updates.timeTarget !== null) {
      if (new Date(updates.timeTarget).getTime() !== new Date(existingOrder.targetDate).getTime()) {
        changes.targetDate = { old: existingOrder.targetDate, new: new Date(updates.timeTarget) }
      }
    }

    // Process Customer Details
    if (updates.customerName !== undefined || updates.customerPhone !== undefined) {
      if (existingOrder.customer) {
        let nameChanged = false;
        let phoneChanged = false;
        if (updates.customerName !== undefined && updates.customerName !== existingOrder.customer.name) {
          changes.customerName = { old: existingOrder.customer.name, new: updates.customerName };
          nameChanged = true;
        }
        if (updates.customerPhone !== undefined && updates.customerPhone !== existingOrder.customer.phone) {
          changes.customerPhone = { old: existingOrder.customer.phone, new: updates.customerPhone };
          phoneChanged = true;
        }
        
        if (nameChanged || phoneChanged) {
          const newName = updates.customerName !== undefined ? updates.customerName : existingOrder.customer.name;
          const newPhone = updates.customerPhone !== undefined ? updates.customerPhone : existingOrder.customer.phone;
          
          // Before updating customer, ensure phone doesn't conflict
          if (phoneChanged) {
            const existingCustomerPhone = await prisma.customer.findUnique({ where: { phone: newPhone } });
            if (existingCustomerPhone && existingCustomerPhone.id !== existingOrder.customerId) {
              return NextResponse.json({ error: 'Phone number is already associated with another customer' }, { status: 409 });
            }
          }
          
          await prisma.customer.update({
            where: { id: existingOrder.customerId },
            data: { name: newName, phone: newPhone }
          });
        }
      }
    }

    // Process Items Media
    if (updates.items && Array.isArray(updates.items)) {
      for (const updatedItem of updates.items) {
        if (!updatedItem.id) continue;
        const existingItem = existingOrder.items.find(i => i.id === updatedItem.id);
        if (existingItem) {
          // Check for referenceImages
          const existingRefs = existingItem.media.filter(m => m.type === 'REFERENCE').map(m => m.url);
          const newRefs = updatedItem.referenceImages || [];
          if (JSON.stringify(existingRefs) !== JSON.stringify(newRefs)) {
             changes[`item_${updatedItem.id}_referenceImages`] = { old: existingRefs, new: newRefs };
             await prisma.orderItemMedia.deleteMany({
               where: { orderItemId: existingItem.id, type: 'REFERENCE' }
             });
             if (newRefs.length > 0) {
               await prisma.orderItemMedia.createMany({
                 data: newRefs.map((url: string) => ({
                   orderItemId: existingItem.id,
                   type: 'REFERENCE',
                   url
                 }))
               });
             }
          }
          
          // Check for printImages (Stored as PRODUCTION)
          const existingPrints = existingItem.media.filter(m => m.type === 'PRODUCTION').map(m => m.url);
          const newPrints = updatedItem.printImages || [];
          if (JSON.stringify(existingPrints) !== JSON.stringify(newPrints)) {
             changes[`item_${updatedItem.id}_printImages`] = { old: existingPrints, new: newPrints };
             await prisma.orderItemMedia.deleteMany({
               where: { orderItemId: existingItem.id, type: 'PRODUCTION' }
             });
             if (newPrints.length > 0) {
               await prisma.orderItemMedia.createMany({
                 data: newPrints.map((url: string) => ({
                   orderItemId: existingItem.id,
                   type: 'PRODUCTION',
                   url
                 }))
               });
             }
          }
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        customerNotes: updates.customerInstructions !== undefined ? updates.customerInstructions : undefined,
        targetDate: updates.timeTarget !== undefined && updates.timeTarget !== null ? new Date(updates.timeTarget) : undefined,
      }
    })

    // Create Audit Log
    if (Object.keys(changes).length > 0) {
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: 'UPDATE',
          tableName: 'Order',
          recordId: id,
          oldValue: Object.fromEntries(Object.entries(changes).map(([k, v]: any) => [k, v.old])),
          newValue: Object.fromEntries(Object.entries(changes).map(([k, v]: any) => [k, v.new])),
          reason: updates.editReason || 'Salesperson edit'
        }
      })

      // Create Timeline Entry
      await TimelineService.create({
        orderId: id,
        status: updatedOrder.status,
        nextState: updatedOrder.status,
        eventType: TimelineEventType.SYSTEM_ACTION,
        action: 'ORDER_EDITED',
        note: `Order details edited by ${session.user.name}.`,
        actorId: session.user.id,
        role: session.user.role,
      })
    }

    return NextResponse.json({ success: true, order: updatedOrder })

  } catch (error: any) {
    console.error('Order Edit Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
