import { prisma } from './src/lib/prisma';
import { StorefrontEngine } from './src/lib/orders/StorefrontEngine';

async function run() {
  console.log("Starting Custom Cake Data Integrity Verification...");

  const branchId = "cmswuiiun00031su3vfrn9eq5";
  const productId = "cmsjy6omi000gtcu39fm7li8v"; // Mock custom cake product ID
  
  const payload = {
    idempotencyKey: `custom-${Date.now()}`,
    customer: { name: "Custom User", phone: "9898989898", email: "custom@test.com" },
    address: { house: "123", street: "Main", area: "Center", city: "Vadodara", pin: "390001" },
    items: [{ 
      productId: productId, 
      quantity: 1, 
      weight: 2,
      flavor: "Chocolate Truffle",
      messageOnCake: "Happy Birthday",
      notes: "Deliver after 6 PM", // specialInstructions mapped to notes in checkout payload
      referenceImages: ["http://cloudinary.com/fake-ref-image.jpg"]
    }],
    paymentMethod: "CASH", 
    deliveryType: "DELIVERY",
    branchId: branchId,
    deliveryDate: new Date(Date.now() + 86400000).toISOString(),
  };

  const resUnpaid = await fetch('http://localhost:3000/api/v1/public/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await resUnpaid.json();
  if (!json.success) {
    console.error("Failed to create custom order:", json);
    process.exit(1);
  }
  
  const orderId = json.orderId;
  console.log(`Order Created: ${orderId}`);

  const dbOrder = await prisma.order.findUnique({ 
    where: { id: orderId },
    include: { items: true }
  });

  if (!dbOrder) throw new Error("Order not found");
  
  const item = dbOrder.items[0];
  console.log("DB Item messageOnCake:", item.messageOnCake);
  console.log("DB Item notes (specialInstructions):", item.notes);
  console.log("DB Item flavor:", item.flavor);
  console.log("DB Item weight:", item.weight);
  
  if (item.messageOnCake === "Happy Birthday" && item.notes === "Deliver after 6 PM") {
    console.log("PASS: messageOnCake and specialInstructions remain separate in DB.");
  } else {
    console.error("FAIL: Fields merged or missing.");
  }
  
  // Also Notification DTO (WhatsAppTemplateService) uses them separately. (Verified Statically).
}

run().catch(console.error).finally(() => prisma.$disconnect());
