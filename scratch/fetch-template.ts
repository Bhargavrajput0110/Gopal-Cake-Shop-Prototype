import 'dotenv/config';

async function run() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  // Get WABA ID from the phoneNumberId or use the endpoint
  // A simple way to get templates is via WhatsApp Business Account ID.
  // First get WABA ID
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const wabaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}?fields=whatsapp_business_account`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const wabaData = await wabaRes.json();
  console.log('WABA Data:', JSON.stringify(wabaData, null, 2));
  if (!wabaData.whatsapp_business_account) {
    console.error('Failed to get WABA ID');
    return;
  }
  const wabaId = wabaData.whatsapp_business_account.id;

  const templatesRes = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/message_templates?name=order_approved_pickup`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const templatesData = await templatesRes.json();
  console.log(JSON.stringify(templatesData, null, 2));
}

run();
