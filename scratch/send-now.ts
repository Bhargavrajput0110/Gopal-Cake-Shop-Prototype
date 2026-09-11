// Send notification for the newly approved order ORD-1789045209822-CC73
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

async function sendWA(phone: string, templateName: string, vars: {name:string;text:string}[], mediaId: string | null) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 10 && /^[6-9]/.test(p)) p = '91' + p;
  
  const components: any[] = [];
  if (mediaId) components.push({ type: 'header', parameters: [{ type: 'image', image: { id: mediaId } }] });
  components.push({ type: 'body', parameters: vars.map(v => ({ type: 'text', parameter_name: v.name, text: v.text })) });
  
  const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: p, type: 'template', template: { name: templateName, language: { code: 'en' }, components } }),
    signal: AbortSignal.timeout(15_000),
  });
  return res.json();
}

async function run() {
  // ORD-1789045209822-CC73 — Bhargav Paresh Rajput — 7575849772 — PICKUP
  const mediaId = await uploadMedia('https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400');
  console.log('Uploaded media:', mediaId ? '✅' : '❌');
  
  const vars = [
    { name: 'customer_name', text: 'Bhargav Paresh Rajput' },
    { name: 'order_id', text: 'ORD-1789045209822-CC73' },
    { name: 'order_date', text: '10 Sept 2026' },
    { name: 'order_details', text: 'Your order' },
    { name: 'message_on_cake', text: 'None' },
    { name: 'special_instructions', text: 'None' },
    { name: 'order_total', text: '2' },
    { name: 'amount_paid', text: '0' },
    { name: 'payment_summary', text: 'Balance Due: Rs. 2' },
    { name: 'store_name', text: 'Gopal Cake Shop' },
    { name: 'store_address', text: 'Uma' },
    { name: 'pickup_datetime', text: '10 Sept 2026' },
  ];
  
  const result: any = await sendWA('7575849772', 'order_approved_pickup', vars, mediaId);
  if (result.messages?.[0]?.id) {
    console.log('✅ Sent! wamid =', result.messages[0].id);
  } else {
    console.error('❌ Failed:', JSON.stringify(result, null, 2));
  }
}

run();
