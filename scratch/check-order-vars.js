const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  const orderId = 'cmtrd5o4q000004juvanxd3gi'; 
  const res = await pool.query(`
    SELECT o."orderNumber", o."targetDate", o."subtotal", o."deliveryCharge", o."totalAmount", o."status",
           c.name as customer_name,
           oi."productName" as item_name, oi."messageOnCake", oi.notes
    FROM "Order" o
    LEFT JOIN "Customer" c ON c.id = o."customerId"
    LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
    WHERE o.id = $1
  `, [orderId]);
  
  const paymentRes = await pool.query(`
    SELECT amount, method, type, status FROM "Payment" WHERE "orderId" = $1
  `, [orderId]);

  const order = res.rows[0];
  const itemsStr = res.rows.map(r => `1x ${r.item_name}`).join(', ');
  const msgs = res.rows.map(r => r.messageOnCake).filter(Boolean).join(', ') || 'None';
  const notes = order.notes || 'None';
  
  const paid = paymentRes.rows.filter(p => p.status === 'SUCCESS').reduce((acc, p) => acc + Number(p.amount), 0);
  const total = Number(order.totalAmount);
  const bal = Math.max(total - paid, 0);
  
  const vars = [
    order.customer_name || 'Customer',
    order.orderNumber,
    new Date(order.targetDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    itemsStr,
    msgs,
    notes,
    Math.round(total).toString(),
    Math.round(paid).toString(),
    bal === 0 ? 'Paid in Full' : `Balance Due: Rs. ${bal}`,
    'Gopal Cake Shop',
    'TBD',
    new Date(order.targetDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  ];

  console.log(JSON.stringify(vars, null, 2));
  
  // Try sending it via CURL if we have the token
  const token = 'EAA...'; // We can test this if we extract token
  pool.end();
}

run().catch(e => { console.error(e); pool.end(); });
