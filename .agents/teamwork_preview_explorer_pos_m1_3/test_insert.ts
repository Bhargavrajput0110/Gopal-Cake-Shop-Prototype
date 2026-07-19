import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key configured:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const testId = 'KHM-TEST-999';
  const orderTypes = ['takeaway', 'walk_in', 'pickup', 'delivery', 'PICKUP', 'DELIVERY'];
  
  for (const oType of orderTypes) {
    const payload = {
      id: testId,
      orderType: oType,
      status: 'waiting_for_chef',
      customerName: 'Walk-in Customer',
      customerPhone: 'POS-123456',
      branch: 'khanderao',
      items: [{ name: 'Test Cake', qty: 1, weight: '1kg' }],
      subtotal: 100,
      discount: 0,
      tax: 5,
      deliveryCharge: 0,
      grandTotal: 105,
      advancePaid: 105,
      pendingBalance: 0,
      priorityLevel: 'normal',
      isSurprise: false,
      timeTarget: new Date().toISOString(),
      customerInstructions: 'Payment: CASH',
      timeline: [{ event: 'Order Created', actor: 'Customer', timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(`--- Testing orderType: "${oType}" ---`);
    const { data, error } = await supabase
      .from('orders')
      .insert(payload)
      .select();

    if (error) {
      console.log(`❌ Failed with error: ${error.message} (Code: ${error.code})`);
    } else {
      console.log(`✅ Success! Data:`, data);
      
      // Clean up
      console.log('Cleaning up...');
      const { error: delError } = await supabase
        .from('orders')
        .delete()
        .eq('id', testId);
      if (delError) console.error('Cleanup error:', delError);
    }
  }
}

testInsert();
