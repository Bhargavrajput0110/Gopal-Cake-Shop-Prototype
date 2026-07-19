import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> | { orderId: string } }) {
  try {
    const resolvedParams = await params;
    const { orderId } = resolvedParams;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return a rich mock order so the confirmation page renders successfully without errors
    const mockOrder = {
      id: orderId,
      orderType: "pickup",
      status: "WAITING_FOR_CHEF",
      customerName: "Test User",
      customerPhone: "9876543210",
      branch: "Main Branch",
      items: [
        { name: "Custom Cake", qty: 1, weight: "1kg", flavour: "Pineapple" }
      ],
      subtotal: 1100,
      discount: 0,
      tax: 0,
      deliveryCharge: 0,
      grandTotal: 1100,
      advancePaid: 1100,
      pendingBalance: 0,
      priorityLevel: "normal",
      isSurprise: false,
      timeTarget: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      timeline: [
        { event: "Order Placed", actor: "Customer", timestamp: new Date().toISOString() }
      ]
    };

    return NextResponse.json({
      success: true,
      message: "Order fetched successfully (Mock)",
      order: mockOrder
    }, { status: 200 });

  } catch (error) {
    console.error("Mock API error:", error);
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
