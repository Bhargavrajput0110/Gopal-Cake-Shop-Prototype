import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { Printer, DocumentDownload, TickCircle } from "iconsax-react"
import { generateInvoicePDF } from "@/lib/invoice"

interface ReceiptStubProps {
  orderId: string
  onClose?: () => void
}

export function ReceiptStub({ orderId, onClose }: ReceiptStubProps) {
  // Fetch order details for the receipt
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['receipt', orderId],
    queryFn: () => fetchClient<any>(`/orders/${orderId}`)
  })

  if (isLoading || !responseData) {
    return (
      <div className="p-8 text-center font-serif italic text-muted-foreground animate-pulse">
        Generating premium receipt...
      </div>
    );
  }

  // The API returns { success: true, data: { ... } }
  const order = responseData.data || responseData;

  if (!order || !order.orderNumber) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      const invoiceItems = (order.items || []).map((item: any) => ({
        name: item.productName || item.name || 'Custom Cake',
        qty: Number(item.quantity || item.qty || 1),
        weight: item.weight || '1kg',
        flavor: item.flavor || item.flavour || 'Standard',
        price: Number(item.price || 0)
      }));

      const invoiceData = {
        orderId: order.orderNumber || order.id,
        customerName: order.customer?.name || order.customerName || 'Valued Customer',
        customerPhone: order.customer?.phone || order.customerPhone,
        deliveryAddress: order.deliveryAddress || order.customer?.address || order.delivery?.address,
        items: invoiceItems,
        subtotal: Number(order.subtotal || order.totalAmount || 0),
        deliveryCharge: Number(order.deliveryCharge || 0),
        discount: Number(order.discount || 0),
        grandTotal: Number(order.totalAmount || order.grandTotal || 0),
        createdAt: order.createdAt
      };

      const doc = generateInvoicePDF(invoiceData);
      doc.save(`Invoice-${order.orderNumber || order.id}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Unable to download PDF. Try printing instead.');
    }
  };

  const parseNumber = (val: any) => Number(val || 0);

  const subtotal = parseNumber(order.subtotal);
  const deliveryCharge = parseNumber(order.deliveryCharge);
  const discount = parseNumber(order.discount);
  const totalAmount = parseNumber(order.totalAmount || order.grandTotal);
  const tax = Math.max(0, totalAmount - subtotal - deliveryCharge + discount);
  const paidAmount = parseNumber(order.paidAmount || order.advancePaid);
  const pendingBalance = parseNumber(order.pendingBalance || (totalAmount - paidAmount));

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #receipt-stub, #receipt-stub * {
            visibility: visible !important;
          }
          #receipt-stub {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            padding: 2mm 4mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}} />

      {/* Screen Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print-hidden bg-[#3E2723]/5 p-3 rounded-xl border border-[#C5A059]/20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-[#3E2723] uppercase tracking-wider">Official Bill & Receipt</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#C5A059]/30 text-[#3E2723] text-xs font-bold rounded-lg hover:bg-[#FDFBF7] transition-all shadow-sm"
          >
            <DocumentDownload className="w-4 h-4 text-[#C5A059]" />
            PDF Invoice
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3E2723] text-white text-xs font-bold rounded-lg hover:bg-[#2C1C19] transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4 text-[#C5A059]" />
            Print (80mm Thermal)
          </button>
        </div>
      </div>

      {/* Screen & Print Container */}
      <div 
        id="receipt-stub" 
        className="bg-white text-[#2B1810] p-6 max-w-[420px] mx-auto rounded-2xl shadow-xl border border-[#C5A059]/30 text-xs font-sans relative overflow-hidden"
      >
        {/* Subtle Decorative Top Watermark Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#3E2723] via-[#C5A059] to-[#3E2723] -mx-6 -mt-6 mb-5 print-hidden" />

        {/* Brand Header with Logo */}
        <div className="text-center mb-5 pb-4 border-b border-gray-300">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full p-1 bg-white border border-[#C5A059]/40 shadow-sm flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Gopal Cake Shop Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-black uppercase tracking-widest font-serif text-[#3E2723]">Gopal Cake Shop</h1>
          <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mt-0.5">Crafting Sweet Moments Since 1995</p>
          <p className="text-[11px] font-bold mt-1 text-gray-800">{order.branch?.name ? `${order.branch.name} Branch` : "Uma Char Rasta Branch"}</p>
          <p className="text-[10px] text-gray-600 leading-tight">{order.branch?.address || "Waghodia Road, Vadodara, Gujarat"}</p>
          <p className="text-[10px] text-gray-600">Ph: {order.branch?.phone ? `+91 ${order.branch.phone}` : "+91 9898616894"}</p>
          <p className="text-[9px] font-mono mt-1 text-gray-500">GSTIN: 24AAAFG0000A1Z2</p>
        </div>

        {/* Order Meta Badge */}
        <div className="bg-[#FFFDF7] border border-[#C5A059]/30 rounded-xl p-3 mb-4 space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Bill No:</span>
            <span className="font-bold text-[#3E2723] bg-[#C5A059]/10 px-2 py-0.5 rounded border border-[#C5A059]/20">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Order Date:</span>
            <span>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
          </div>
          <div className="flex justify-between font-bold pt-1 border-t border-dashed border-gray-300">
            <span className="text-gray-600">Type:</span>
            <span className="text-[#3E2723] uppercase">{order.deliveryType === 'DELIVERY' ? 'Home Delivery 🚗' : 'Store Pickup 🏬'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Target Time:</span>
            <span className="font-bold text-gray-900">{order.targetDate ? new Date(order.targetDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
          </div>

          {/* Customer Details */}
          {order.customer && (
            <div className="pt-1.5 mt-1.5 border-t border-dashed border-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-bold text-gray-900">{order.customer.name || 'Walk-in'}</span>
              </div>
              {order.customer.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span>+91 {order.customer.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Delivery Address */}
          {(order.deliveryType === 'DELIVERY' || order.deliveryAddress || order.customer?.address) && (
            <div className="pt-1.5 mt-1 border-t border-dashed border-gray-300 font-sans">
              <span className="font-bold uppercase text-[9px] text-[#C5A059] block">Delivery Address:</span>
              <p className="font-semibold text-[11px] text-gray-800 leading-snug mt-0.5">
                {order.deliveryAddress || order.customer?.address || 'Address on file'}
              </p>
            </div>
          )}
        </div>

        {/* Itemized Table */}
        <div className="mb-4">
          <div className="flex justify-between font-bold text-[10px] uppercase tracking-wider text-[#3E2723] border-b-2 border-[#3E2723] pb-1.5 mb-2 font-mono">
            <span>Item & Specifications</span>
            <span>Amount</span>
          </div>
          {order.items?.map((item: any, idx: number) => (
            <div key={item.id || idx} className="mb-2.5 pb-2 border-b border-gray-100 last:border-b-0 font-mono">
              <div className="flex justify-between font-bold text-gray-900 text-[12px]">
                <span>{item.quantity}x {item.productName || item.name}</span>
                <span>₹{(parseNumber(item.price) * parseNumber(item.quantity)).toFixed(2)}</span>
              </div>
              <div className="pl-3 text-[10px] text-gray-600 space-y-0.5 mt-0.5">
                <div>Weight: <span className="font-bold">{item.weight || '1kg'}</span> {item.flavor ? `| Flavor: ${item.flavor}` : ''}</div>
                {item.designName && (
                  <div>Design: <span className="italic">{item.designName}</span> {item.designCode ? `(${item.designCode})` : ''}</div>
                )}
                {item.messageOnCake && (
                  <div className="italic text-[#3E2723] font-serif bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/50 mt-1 inline-block">
                    "{item.messageOnCake}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div className="border-t-2 border-[#3E2723] pt-3 text-[11px] font-mono space-y-1.5">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {deliveryCharge > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charge</span>
              <span>₹{deliveryCharge.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Discount Savings</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Taxes (GST)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-[#3E2723] bg-[#3E2723]/5 p-2 rounded-lg border border-[#3E2723]/10 mt-2">
            <span>TOTAL AMOUNT</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Payment & Balance Status */}
        <div className="border-t border-dashed border-gray-300 mt-4 pt-3 text-[11px] font-mono">
          <div className="flex justify-between font-bold text-[#3E2723] mb-1">
            <span>Advance / Paid Amount:</span>
            <span className="text-emerald-700 font-black">₹{paidAmount.toFixed(2)}</span>
          </div>
          {pendingBalance > 0 ? (
            <div className="flex justify-between font-black text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg mt-1">
              <span>BALANCE DUE AT PICKUP:</span>
              <span>₹{pendingBalance.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 p-2 rounded-lg mt-1">
              <TickCircle className="w-4 h-4 text-emerald-600" />
              <span>FULL PAYMENT RECEIVED</span>
            </div>
          )}
        </div>

        {/* Footer & Instagram Barcode */}
        <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300 text-[10px] space-y-1">
          <p className="font-serif font-black text-xs text-[#3E2723]">Thank You For Celebrating With Us!</p>
          <p className="text-gray-600 font-medium">Please verify your order items before leaving the counter.</p>
          <div className="pt-2 flex items-center justify-center gap-2 text-gray-700 font-mono text-[9px]">
            <span>📷 Instagram: @gopalcakeshop</span>
            <span>•</span>
            <span>🌐 gopalcakeshop.com</span>
          </div>
        </div>
      </div>
    </>
  )
}

