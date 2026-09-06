const Razorpay = require('razorpay');
require('dotenv').config({ path: '.env.local' });

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

rzp.orders.create({
  amount: 1000,
  currency: 'INR',
  receipt: 'receipt_123'
}).then(console.log).catch(console.error);
