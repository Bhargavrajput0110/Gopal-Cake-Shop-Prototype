'use client';

import React, { useState } from 'react';
import { TickCircle, Location, Reserve, Bag, ArrowRight2 } from 'iconsax-react';
import { useRouter } from 'next/navigation';

export default function QuoteCheckoutClient({ quote }: { quote: any }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  if (quote.isPaid) {
    return (
      <div className="bg-white rounded-[2rem] shadow-xl p-10 text-center border border-gray-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <TickCircle className="w-10 h-10 text-green-600" variant="Bold" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h2>
        <p className="text-gray-500 mb-6">This quote has already been paid and converted to an order.</p>
        <p className="font-bold text-gray-800">Order ID: {quote.orderNumber}</p>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (quote.deliveryType === 'DELIVERY' && !deliveryAddress) {
      alert('Please enter a delivery address.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/v1/public/quotes/${quote.orderNumber}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryAddress })
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Success! Refresh the page to show the success state
      router.refresh();
    } catch (err: any) {
      alert(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Quote Header */}
        <div className="bg-[#8B1A4A] p-6 text-white text-center">
          <p className="text-xs font-bold tracking-widest uppercase text-pink-200 mb-1">Quote Reference</p>
          <h2 className="text-2xl font-black">{quote.orderNumber}</h2>
          <p className="text-sm mt-2 text-pink-100">Prepared for <span className="font-bold text-white">{quote.customerName}</span></p>
        </div>

        {/* Items List */}
        <div className="p-6 space-y-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Bag className="w-4 h-4" /> Order Items
          </h3>
          
          {quote.items.map((item: any) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              {item.designImage ? (
                <img src={item.designImage} alt="Cake" className="w-full sm:w-24 h-40 sm:h-24 object-cover rounded-xl shadow-sm" />
              ) : (
                <div className="w-full sm:w-24 h-40 sm:h-24 bg-gray-200 rounded-xl flex items-center justify-center">
                  <Reserve className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-black text-gray-900">{item.name}</h4>
                  <p className="text-lg font-black text-[#8B1A4A]">₹{item.price.toFixed(2)}</p>
                </div>
                
                <div className="text-sm text-gray-500 mt-1 font-medium">
                  {item.quantity} × {item.weight}kg {item.flavor ? `• ${item.flavor}` : ''}
                </div>
                
                {item.messageOnCake && (
                  <div className="mt-3 bg-white px-3 py-2 rounded-lg border border-gray-100 text-sm">
                    <span className="text-xs font-bold text-gray-400 uppercase mr-2">Message:</span>
                    <span className="font-serif italic text-gray-800">"{item.messageOnCake}"</span>
                  </div>
                )}

                {item.referenceImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Reference Images</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {item.referenceImages.map((img: string, idx: number) => (
                        <img key={idx} src={img} alt="Ref" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Details */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Location className="w-4 h-4" /> Delivery Information
          </h3>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <p className="font-bold text-gray-900 mb-2">Method: {quote.deliveryType}</p>
            {quote.deliveryType === 'DELIVERY' && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Enter Delivery Address</label>
                <textarea 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Full address with landmark..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#8B1A4A] focus:ring-1 focus:ring-[#8B1A4A] transition-all min-h-[80px]"
                />
              </div>
            )}
            {quote.deliveryType === 'PICKUP' && (
              <p className="text-sm text-gray-500">You will pick up this order from the designated branch.</p>
            )}
          </div>
        </div>

        {/* Summary & Payment */}
        <div className="p-6 border-t border-gray-100">
          <div className="space-y-3 mb-6 text-sm text-gray-600 font-medium">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{quote.subtotal.toFixed(2)}</span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{quote.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span>₹{quote.deliveryCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
              <span className="text-lg font-black text-gray-900">Total Amount</span>
              <span className="text-3xl font-black text-[#8B1A4A]">₹{quote.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isProcessing || (quote.deliveryType === 'DELIVERY' && !deliveryAddress)}
            className="w-full py-5 bg-[#8B1A4A] hover:bg-[#6c1439] text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isProcessing ? 'Processing Secure Payment...' : (
              <>Pay ₹{quote.totalAmount.toFixed(2)} <ArrowRight2 className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
          <p className="text-center text-xs text-gray-400 mt-4 uppercase tracking-widest font-bold">Secure Payment Gateway</p>
        </div>

      </div>
    </div>
  );
}
