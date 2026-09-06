import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> | { orderId: string } }) {
  try {
    const resolvedParams = await params;
    const { orderId } = resolvedParams;

    // Fetch the actual order from Prisma with all relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        branch: true,
        items: true,
        payments: true,
        timeline: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Format the response to match what the frontend expects
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      orderType: order.deliveryType.toLowerCase(),
      status: order.status,
      customerName: order.customer?.name || "Walk-in",
      customerPhone: order.customer?.phone || "",
      branch: order.branch?.name || "Main Branch",
      items: order.items.map(item => ({
        name: item.productName || item.designName || "Custom Cake",
        qty: item.quantity,
        weight: `${item.weight}kg`,
        flavour: item.flavor || "Standard"
      })),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      tax: 0,
      deliveryCharge: Number(order.deliveryCharge),
      grandTotal: Number(order.totalAmount),
      advancePaid: order.payments.reduce((acc, p) => acc + Number(p.amount), 0),
      pendingBalance: Number(order.totalAmount) - order.payments.reduce((acc, p) => acc + Number(p.amount), 0),
      priorityLevel: order.isPriority ? "high" : "normal",
      isSurprise: false,
      timeTarget: order.targetDate.toISOString(),
      createdAt: order.createdAt.toISOString(),
      timeline: order.timeline.map(t => ({
        event: t.action,
        actor: t.systemGenerated ? "System" : (t.actorId ? "Staff" : "Customer"),
        timestamp: t.createdAt.toISOString()
      }))
    };

    return NextResponse.json({
      success: true,
      message: "Order fetched successfully",
      order: formattedOrder
    }, { status: 200 });

  } catch (error) {
    console.error("Order fetch API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
