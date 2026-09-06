import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import QuoteCheckoutClient from './QuoteCheckoutClient';

export default async function QuotePage({ params }: { params: any }) {
  const { id } = await params; // orderNumber

  const order = await prisma.order.findUnique({
    where: { orderNumber: id },
    include: {
      items: {
        include: { media: true }
      },
      customer: true
    }
  });

  if (!order || order.type !== 'QUOTE') {
    notFound();
  }

  // Determine if it's already paid
  const isPaid = order.status !== 'QUOTE_DRAFT' && order.status !== 'QUOTE_SENT';

  // Format data for the client component
  const quoteData = {
    orderNumber: order.orderNumber,
    customerName: order.customer?.name || 'Customer',
    totalAmount: Number(order.totalAmount),
    deliveryCharge: Number(order.deliveryCharge),
    discount: Number(order.discount),
    subtotal: Number(order.subtotal),
    deliveryType: order.deliveryType,
    isPaid,
    items: order.items.map(item => ({
      id: item.id,
      name: item.designName || item.productName,
      price: Number(item.price),
      quantity: item.quantity,
      weight: item.weight,
      flavor: item.flavor,
      messageOnCake: item.messageOnCake,
      referenceImages: item.media?.map(m => m.url) || [],
      designImage: item.designImageUrl || item.image
    }))
  };

  return (
    <div className="min-h-screen bg-[#FDF7F0] font-sans selection:bg-[#8B1A4A] selection:text-white">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 pt-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#8B1A4A] font-serif tracking-tight mb-2">Gopal Cake Shop</h1>
          <p className="text-sm font-bold text-gray-500 tracking-[0.2em] uppercase">Custom Order Quote</p>
        </header>

        <QuoteCheckoutClient quote={quoteData} />
      </div>
    </div>
  );
}
