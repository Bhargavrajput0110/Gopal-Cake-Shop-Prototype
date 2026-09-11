import 'dotenv/config';

async function run() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const phone = '917575849772'; 
  const templateName = 'order_approved_pickup';
  
  const parameterNames = [
    "customer_name", "order_id", "order_date", "order_details",
    "message_on_cake", "special_instructions", "order_total",
    "amount_paid", "payment_summary", "store_name", "store_address", "pickup_datetime"
  ];
  const variables = [
    "Bhargav", "ORD-123", "08 Sept 2026", "1x test",
    "Hiii", "Test", "2", "1", "Balance Due: Rs. 1",
    "Gopal Cake Shop", "TBD", "08 Sept 2026, 12:30 pm"
  ];

  // Upload an image first
  const imgUrl = 'https://gopalcakeshop.com/logo.png'; // fallback image
  let mediaId = '';
  try {
    const imageRes = await fetch(imgUrl);
    const buffer = await imageRes.arrayBuffer();
    
    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('file', new Blob([buffer], { type: 'image/png' }), 'image.png');
    formData.append('type', 'image/png');

    const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const uploadData = await uploadRes.json();
    mediaId = uploadData.id;
    console.log('Uploaded media:', mediaId);
  } catch (e) {
    console.error('Upload failed', e);
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: [
        {
          type: 'header',
          parameters: [{ type: 'image', image: { id: mediaId } }]
        },
        {
          type: 'body',
          parameters: variables.map((v, i) => ({ type: 'text', text: v, parameter_name: parameterNames[i] })),
        },
      ],
    },
  };

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}

run();
