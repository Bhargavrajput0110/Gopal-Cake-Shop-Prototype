// Retry just the one failed delivery order
process.env.DATABASE_URL = 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
process.env.SKIP_ENV_VALIDATION = 'true';
import * as dotenv from 'dotenv';
dotenv.config();

const META_API_VERSION = 'v19.0';
const token = process.env.WHATSAPP_ACCESS_TOKEN!;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;

async function uploadMedia(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    const ct = r.headers.get('content-type') || 'image/jpeg';
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('file', new Blob([buf], { type: ct }), 'img.jpg');
    form.append('type', ct);
    const up = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/media`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
    });
    const d: any = await up.json();
    return d.id ?? null;
  } catch { return null; }
}

async function run() {
  const mediaId = await uploadMedia('https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400');
  console.log('Uploaded media:', mediaId);
  
  const vars = [
    { name: 'customer_name', text: 'Bhargav Rajput' },
    { name: 'order_id', text: 'ORD-1788518821176-BD36' },
    { name: 'order_date', text: '04 Sept 2026' },
    { name: 'order_details', text: '1x Flamingo Cake' },
    { name: 'message_on_cake', text: 'None' },
    { name: 'special_instructions', text: 'None' },
    { name: 'order_total', text: '6452' },
    { name: 'amount_paid', text: '0' },
    { name: 'payment_summary', text: 'Balance Due: Rs. 6452' },
    { name: 'delivery_address', text: 'Dahiba Nagar, GIDC Industrial Area, Manjalpur, Vadodara' },
    { name: 'delivery_datetime', text: '04 Sept 2026' },
  ];
  
  const components: any[] = [];
  if (mediaId) components.push({ type: 'header', parameters: [{ type: 'image', image: { id: mediaId } }] });
  components.push({ type: 'body', parameters: vars.map(v => ({ type: 'text', parameter_name: v.name, text: v.text })) });
  
  const payload = {
    messaging_product: 'whatsapp',
    to: '917575849772', // corrected phone
    type: 'template',
    template: { name: 'order_approved_delivery', language: { code: 'en' }, components },
  };
  
  const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
