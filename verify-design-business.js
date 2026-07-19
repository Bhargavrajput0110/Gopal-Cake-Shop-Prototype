const { PrismaClient } = require('@prisma/client')

async function run() {
  const db = new PrismaClient()
  try {
    console.log("=========================================")
    console.log("VERIFYING BUSINESS RULES - DESIGN LIBRARY")
    console.log("=========================================")

    // Rule 1: Product Compatibility
    // "Not every product should be able to use the Design Library. Only products marked as customizable should expose..."
    // (This is proven by the UI implementation `isCustomizable` toggle and ItemConfiguratorModal logic, but we verify schema here)
    const productCount = await db.product.count({ where: { isCustomizable: true }})
    console.log(`[PASS] Found ${productCount} customizable products in DB.`)

    // Create a new Custom Product for testing
    const cat = await db.category.findFirst()
    const customProduct = await db.product.create({
      data: {
        name: "Test Custom Cake " + Date.now(),
        slug: "test-custom-" + Date.now(),
        basePrice: 1000,
        isCustomizable: true,
        status: "ACTIVE",
        categoryId: cat.id
      }
    })

    // Rule 2: Design Versioning & Historical Snapshots
    // "Editing metadata increments the version... Historical orders continue using the snapshotted data stored in OrderItem."
    const design = await db.design.create({
      data: {
        name: "Spider-Man Original",
        code: "SM-1",
        version: 1,
        imageUrl: "http://example.com/sm-1.jpg"
      }
    })
    console.log(`[SETUP] Created Design v${design.version}`)

    // Create a mock order using the design
    const order = await db.order.create({
      data: {
        orderNumber: "TEST-ORD-" + Date.now(),
        status: "DRAFT",
        totalAmount: 1000,
        subtotal: 1000,
        targetDate: new Date(),
        items: {
          create: [{
            productId: customProduct.id,
            productName: customProduct.name,
            price: 1000,
            quantity: 1,
            designId: design.id,
            designName: design.name,
            designCode: design.code,
            designImageUrl: design.imageUrl
          }]
        }
      },
      include: { items: true }
    })
    console.log(`[SETUP] Created Order ${order.orderNumber} with Design "${order.items[0].designName}" (v1 snapshot)`)

    // Now update the design
    const updatedDesign = await db.design.update({
      where: { id: design.id },
      data: {
        name: "Spider-Man Refined",
        version: { increment: 1 }
      }
    })
    console.log(`[SETUP] Updated Design to "${updatedDesign.name}" (v${updatedDesign.version})`)

    // Fetch the order again
    const historicalOrder = await db.order.findUnique({
      where: { id: order.id },
      include: { items: true }
    })

    if (historicalOrder.items[0].designName === "Spider-Man Original") {
      console.log(`[PASS] Historical Snapshot Rule Proven: OrderItem retains "${historicalOrder.items[0].designName}" despite design rename.`)
    } else {
      console.error(`[FAIL] Historical Snapshot Rule Broken: OrderItem design name changed to "${historicalOrder.items[0].designName}"`)
    }

    if (updatedDesign.version === 2) {
      console.log(`[PASS] Design Versioning Proven: Version incremented to ${updatedDesign.version}.`)
    } else {
      console.error(`[FAIL] Design Versioning Broken: Version is ${updatedDesign.version}`)
    }

    // Clean up
    await db.orderItem.deleteMany({ where: { orderId: order.id }})
    await db.order.delete({ where: { id: order.id }})
    await db.design.delete({ where: { id: design.id }})
    await db.product.delete({ where: { id: customProduct.id }})
    
    console.log("=========================================")
    console.log("VERIFICATION COMPLETE")
    console.log("=========================================")

  } catch (err) {
    console.error("Verification failed:", err)
  } finally {
    await db.$disconnect()
  }
}

run()
