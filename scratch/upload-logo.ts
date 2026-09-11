/**
 * Upload the Gopal Cake Shop logo to Meta WhatsApp servers.
 * Gets a reusable media_id that we can hardcode as the fallback image.
 * 
 * Run: npx tsx --env-file=.env scratch/upload-logo.ts
 */
process.env.SKIP_ENV_VALIDATION = 'true';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

const token = process.env.WHATSAPP_ACCESS_TOKEN!;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const META_API_VERSION = 'v19.0';

async function run() {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  
  if (!fs.existsSync(logoPath)) {
    console.error('Logo not found at:', logoPath);
    return;
  }
  
  const logoBuffer = fs.readFileSync(logoPath);
  console.log(`Logo size: ${logoBuffer.length} bytes`);
  
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('file', new Blob([logoBuffer], { type: 'image/png' }), 'logo.png');
  form.append('type', 'image/png');
  
  const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  
  const data: any = await res.json();
  
  if (data.id) {
    console.log('\n✅ Logo uploaded successfully!');
    console.log('media_id:', data.id);
    console.log('\nUse this as the fallback media_id in WhatsAppTemplateService:');
    console.log(`WHATSAPP_FALLBACK_MEDIA_ID=${data.id}`);
    console.log('\nAdd this to your .env and Vercel environment variables.');
  } else {
    console.error('❌ Upload failed:', JSON.stringify(data, null, 2));
  }
}

run();
