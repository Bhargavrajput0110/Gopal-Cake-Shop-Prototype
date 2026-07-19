import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateOrderId() {
  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  return `KHM-${10200 + (count || 0) + 1}`;
}

async function seedOrders() {
  const orders: any[] = [];

  // 1. Custom Cake Order
  orders.push({
    id: await generateOrderId(),
    orderType: "delivery",
    status: "new",
    customerName: "Sneha Desai",
    customerPhone: "9876543210",
    branch: "khanderao",
    delivery: { address: "12, Green Park Society, Akota" },
    items: [{
      name: "3-Tier Custom Wedding Cake",
      qty: 1,
      weight: "5kg",
      referenceImages: ["https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80"],
      notes: "Please make exactly as the picture."
    }],
    subtotal: 5000,
    discount: 0,
    tax: 250,
    deliveryCharge: 150,
    grandTotal: 5400,
    advancePaid: 2700,
    pendingBalance: 2700,
    priorityLevel: "high",
    isSurprise: false,
    vip: false,
    timeTarget: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // tomorrow
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [{ event: 'Order Created', actor: 'System', timestamp: new Date().toISOString() }],
    payments: [{ paymentType: 'advance', amount: 2700, method: 'upi', timestamp: new Date().toISOString() }],
    vendorTasks: [{
      vendorType: 'flower',
      status: 'pending',
      instructions: 'Need fresh white roses for the wedding cake.',
      referenceImage: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&q=80'
    }]
  });

  // 2. Photo Cake Order
  orders.push({
    id: await generateOrderId() + "B",
    orderType: "pickup",
    status: "waiting_for_chef",
    customerName: "Rahul Sharma",
    customerPhone: "9123456789",
    branch: "khanderao",
    items: [{
      name: "Photo Cream Cake",
      qty: 1,
      weight: "1kg",
      printImages: ["https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80"],
      notes: "Print the baby's photo on the cake."
    }],
    subtotal: 800,
    discount: 50,
    tax: 37.5,
    deliveryCharge: 0,
    grandTotal: 787.5,
    advancePaid: 787.5,
    pendingBalance: 0,
    priorityLevel: "normal",
    isSurprise: true,
    vip: false,
    timeTarget: new Date(Date.now() + 5 * 3600 * 1000).toISOString(), // 5 hours from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [{ event: 'Order Created', actor: 'System', timestamp: new Date().toISOString() }],
    payments: [{ paymentType: 'advance', amount: 787.5, method: 'card', timestamp: new Date().toISOString() }],
    vendorTasks: [{
      vendorType: 'photo',
      status: 'pending',
      instructions: 'Print this edible photo on sugar sheet. A4 size.',
    }]
  });

  // 3. Regular POS Walk-in Order
  orders.push({
    id: await generateOrderId() + "C",
    orderType: "walk_in",
    status: "delivered", // Already done
    customerName: "Amit Patel",
    customerPhone: "9988776655",
    branch: "khanderao",
    items: [
      { name: "Black Forest Pastry", qty: 4 },
      { name: "Cheese Croissant", qty: 2 }
    ],
    subtotal: 350,
    discount: 0,
    tax: 17.5,
    deliveryCharge: 0,
    grandTotal: 367.5,
    advancePaid: 367.5,
    pendingBalance: 0,
    priorityLevel: "normal",
    isSurprise: false,
    vip: false,
    timeTarget: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      { event: 'Order Created', actor: 'System', timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
      { event: 'Order Delivered', actor: 'System', timestamp: new Date().toISOString() }
    ],
    payments: [{ paymentType: 'advance', amount: 367.5, method: 'cash', timestamp: new Date().toISOString() }]
  });

  for (const o of orders) {
    const { error } = await supabase.from('orders').insert(o);
    if (error) {
      console.error(`Error inserting ${o.id}:`, error.message);
    } else {
      console.log(`Inserted ${o.id}`);
    }
  }

  console.log("Seeding complete!");
}

seedOrders();
