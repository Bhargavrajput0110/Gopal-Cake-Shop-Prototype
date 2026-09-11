/**
 * Standalone script — no Prisma adapter needed.
 * Uses raw pg + the WhatsAppProvider to resend ORDER_APPROVED notifications.
 */
process.env.DATABASE_URL = 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
process.env.SKIP_ENV_VALIDATION = 'true';

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_URL = 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

const token = process.env.WHATSAPP_ACCESS_TOKEN!;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const META_API_VERSION = 'v19.0';

async function uploadMedia(imageUrl: string): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
    if (!imgRes.ok) return null;
    const buffer = await imgRes.arrayBuffer();
    const ct = imgRes.headers.get('content-type') || 'image/jpeg';
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('file', new Blob([buffer], { type: ct }), 'img.jpg');
    form.append('type', ct);
    const uploadRes = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data: any = await uploadRes.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

async function sendApproval(phone: string, vars: { name: string; text: string }[], mediaId: string | null, templateName: string) {
  // Normalize phone to international format
  let normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.startsWith('0')) normalizedPhone = normalizedPhone.slice(1);
  if (normalizedPhone.length === 10 && /^[6-9]/.test(normalizedPhone)) normalizedPhone = '91' + normalizedPhone;
  const components: any[] = [];
  if (mediaId) {
    components.push({ type: 'header', parameters: [{ type: 'image', image: { id: mediaId } }] });
  }
  components.push({
    type: 'body',
    parameters: vars.map(v => ({ type: 'text', parameter_name: v.name, text: v.text })),
  });

  const payload = {
    messaging_product: 'whatsapp',
    to: normalizedPhone,
    type: 'template',
    template: { name: templateName, language: { code: 'en' }, components },
  };

  const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  return res.json();
}

async function run() {
  if (!token || !phoneNumberId) {
    console.error('❌ Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
    return;
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { rows: orders } = await pool.query(`
    SELECT
      o.id, o."orderNumber", o."deliveryType", o."targetDate", o."branchId",
      o."subtotal", o."deliveryCharge", o."totalAmount",
      c.name as customer_name, c.phone as customer_phone,
      b.name as branch_name, b.address as branch_address,
      o."deliveryAddress"
    FROM "Order" o
    JOIN "Customer" c ON c.id = o."customerId"
    LEFT JOIN "Branch" b ON b.id = o."branchId"
    WHERE o.status IN ('CONFIRMED','WAITING_FOR_CHEF','CHEF_ACCEPTED','MAKING','DECORATING','READY','READY_FOR_PICKUP','OUT_FOR_DELIVERY','ON_THE_WAY','DELIVERED','PICKED_UP','COMPLETED')
      AND o."updatedAt" >= $1
    ORDER BY o."updatedAt" DESC
    LIMIT 50
  `, [since]);

  console.log(`Found ${orders.length} approved orders in the last 30 days`);

  let sent = 0, failed = 0;

  for (const order of orders) {
    if (!order.customer_phone) {
      console.log(`⚠️  ${order.orderNumber}: No phone, skipping`);
      continue;
    }

    const { rows: items } = await pool.query(`
      SELECT "productName", quantity FROM "OrderItem" WHERE "orderId" = $1
    `, [order.id]);

    // Get payments
    const { rows: payments } = await pool.query(`
      SELECT amount, status, method FROM "Payment" WHERE "orderId" = $1
    `, [order.id]);

    // Get cake image from OrderItem
    const { rows: mediaRows } = await pool.query(`
      SELECT "designImageUrl" as url FROM "OrderItem" WHERE "orderId" = $1 AND "designImageUrl" IS NOT NULL LIMIT 1
    `, [order.id]);

    // Get customization
    const { rows: custRows } = await pool.query(`
      SELECT "messageOnCake", notes FROM "OrderItem" WHERE "orderId" = $1 LIMIT 1
    `, [order.id]);

    const itemsList = items.map(i => `${i.quantity}x ${i.productName}`).join(', ') || 'Order items';
    const msgOnCake = custRows[0]?.messageOnCake || 'None';
    const specInstr = custRows[0]?.notes || 'None';
    const total = Math.round(Number(order.totalAmount));
    const amountPaid = payments
      .filter((p: any) => p.status === 'SUCCESS')
      .reduce((acc: number, p: any) => acc + Number(p.amount), 0);
    const balance = Math.max(total - amountPaid, 0);
    const paymentSummary = balance === 0 ? 'Paid in Full' : `Balance Due: Rs. ${balance}`;
    const imageUrl = mediaRows[0]?.url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400';
    const orderDate = new Date(order.targetDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const isDelivery = order.deliveryType === 'DELIVERY';
    let templateName: string;
    let vars: { name: string; text: string }[];

    if (isDelivery) {
      templateName = 'order_approved_delivery';
      vars = [
        { name: 'customer_name', text: order.customer_name },
        { name: 'order_id', text: order.orderNumber },
        { name: 'order_date', text: orderDate },
        { name: 'order_details', text: itemsList },
        { name: 'message_on_cake', text: msgOnCake },
        { name: 'special_instructions', text: specInstr },
        { name: 'order_total', text: String(total) },
        { name: 'amount_paid', text: String(Math.round(amountPaid)) },
        { name: 'payment_summary', text: paymentSummary },
        { name: 'delivery_address', text: (order.deliveryAddress || 'TBD').slice(0, 200) },
        { name: 'delivery_datetime', text: orderDate },
      ];
    } else {
      templateName = 'order_approved_pickup';
      vars = [
        { name: 'customer_name', text: order.customer_name },
        { name: 'order_id', text: order.orderNumber },
        { name: 'order_date', text: orderDate },
        { name: 'order_details', text: itemsList },
        { name: 'message_on_cake', text: msgOnCake },
        { name: 'special_instructions', text: specInstr },
        { name: 'order_total', text: String(total) },
        { name: 'amount_paid', text: String(Math.round(amountPaid)) },
        { name: 'payment_summary', text: paymentSummary },
        { name: 'store_name', text: order.branch_name || 'Gopal Cake Shop' },
        { name: 'store_address', text: order.branch_address || 'TBD' },
        { name: 'pickup_datetime', text: orderDate },
      ];
    }

    console.log(`\n📦 ${order.orderNumber} → ${order.customer_phone} (${templateName})`);

    // Upload image
    const mediaId = await uploadMedia(imageUrl);
    console.log(`   🖼  Image: ${mediaId ? '✅ uploaded' : '⚠️  failed, skipping header'}`);

    // Send notification
    const result: any = await sendApproval(order.customer_phone, vars, mediaId, templateName);

    if (result.messages?.[0]?.id) {
      console.log(`   ✅ Sent! wamid=${result.messages[0].id}`);
      sent++;
    } else {
      console.error(`   ❌ Failed: ${result.error?.message || JSON.stringify(result)}`);
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n============================`);
  console.log(`✅ Sent: ${sent} | ❌ Failed: ${failed}`);
  await pool.end();
}

run().catch(e => { console.error(e); pool.end(); process.exit(1); });
