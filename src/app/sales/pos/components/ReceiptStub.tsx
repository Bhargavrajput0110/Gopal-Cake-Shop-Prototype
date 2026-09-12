import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { Printer } from "iconsax-react"

interface ReceiptStubProps {
  orderId: string
}

export function ReceiptStub({ orderId }: ReceiptStubProps) {
  // Fetch order details for the receipt
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['receipt', orderId],
    queryFn: () => fetchClient<any>(`/orders/${orderId}`)
  })

  if (isLoading || !responseData) return null

  // The API returns { success: true, data: { ... } }
  const order = responseData.data || responseData;

  // If we still don't have an order object, don't crash
  if (!order || !order.orderNumber) return null

  const handlePrint = () => {
    window.print()
  }

  const parseNumber = (val: any) => Number(val || 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-stub, #receipt-stub * {
            visibility: visible;
          }
          #receipt-stub {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm; /* standard thermal receipt width */
            padding: 0;
            margin: 0;
          }
        }
      `}} />

      <button 
        onClick={handlePrint}
        className="flex items-center gap-2 px-6 py-3 bg-white border border-border text-foreground rounded-lg font-bold hover:bg-muted transition-colors shadow-sm"
      >
        <Printer className="w-5 h-5" />
        Print Receipt
      </button>

      {/* Hidden Print Section - Optimized for 80mm thermal receipt printer */}
      <div id="receipt-stub" className="hidden print:block w-[80mm] bg-white text-black p-4 text-sm font-mono z-[9999]">
        <div className="text-center mb-4 border-b border-black pb-3">
          <h1 className="text-xl font-black uppercase tracking-wider">Gopal Cake Shop</h1>
          <p className="text-xs font-bold">{order.branch?.name ? `${order.branch.name} Branch` : "Uma Char Rasta Branch"}</p>
          <p className="text-xs">{order.branch?.address || "Waghodia Road, Vadodara, Gujarat"}</p>
          <p className="text-xs">Ph: {order.branch?.phone ? `+91 ${order.branch.phone}` : "+91 9898616894"}</p>
          <p className="text-[10px] mt-1 text-gray-700">GSTIN: 24AAAFG0000A1Z2</p>
        </div>

        <div className="border-b border-black border-dashed pb-2 mb-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Order No:</span>
            <span className="font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Placed:</span>
            <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</span>
          </div>
          <div className="flex justify-between font-bold pt-1 border-t border-black border-dashed">
            <span>Fulfillment:</span>
            <span>{order.deliveryType === 'DELIVERY' ? 'HOME DELIVERY 🚗' : 'STORE PICKUP 🏬'}</span>
          </div>
          <div className="flex justify-between">
            <span>Target Date:</span>
            <span>{order.targetDate ? new Date(order.targetDate).toLocaleString() : '-'}</span>
          </div>
          
          {/* Customer Details */}
          {order.customer && (
            <div className="pt-1 mt-1 border-t border-black border-dashed">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{order.customer.name || 'Walk-in'}</span>
              </div>
              {order.customer.phone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{order.customer.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Delivery Address (if Delivery order) */}
          {(order.deliveryType === 'DELIVERY' || order.deliveryAddress || order.customer?.address) && (
            <div className="pt-1 mt-1 border-t border-black border-dashed">
              <span className="font-bold uppercase text-[10px] block">Deliver To:</span>
              <p className="font-bold text-xs leading-snug mt-0.5">
                {order.deliveryAddress || order.customer?.address || 'Address on file'}
              </p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between font-bold border-b border-black pb-1 mb-2 text-xs">
            <span>Item</span>
            <span>Amt</span>
          </div>
          {order.items?.map((item: any, idx: number) => (
            <div key={item.id || idx} className="mb-2 text-xs">
              <div className="flex justify-between">
                <span>{item.quantity}x {item.productName}</span>
                <span>{(parseNumber(item.price) * parseNumber(item.quantity)).toFixed(2)}</span>
              </div>
              <div className="pl-4 text-[10px] text-gray-600">
                {item.weight}kg {item.flavor ? `| ${item.flavor}` : ''}
              </div>
              {item.designName && (
                <div className="pl-4 text-[10px] text-gray-600">Design: {item.designName} {item.designCode ? `(${item.designCode})` : ''}</div>
              )}
              {item.media && item.media.filter((m: any) => m.type === 'REFERENCE').length > 0 && (
                <div className="pl-4 text-[10px] text-gray-600">Ref Images Attached: Yes ({item.media.filter((m: any) => m.type === 'REFERENCE').length})</div>
              )}
              {item.messageOnCake && (
                <div className="pl-4 text-[10px] text-gray-600">Msg: {item.messageOnCake}</div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-black py-2 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{parseNumber(order.subtotal).toFixed(2)}</span>
          </div>
          {(parseNumber(order.deliveryCharge) > 0) && (
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span>{parseNumber(order.deliveryCharge).toFixed(2)}</span>
            </div>
          )}
          {(parseNumber(order.discount) > 0) && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{parseNumber(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{(parseNumber(order.totalAmount) - parseNumber(order.subtotal) - parseNumber(order.deliveryCharge) + parseNumber(order.discount)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-black mt-2 pt-2 border-t border-black">
            <span>TOTAL</span>
            <span>₹{parseNumber(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
        
        {(parseNumber(order.paidAmount) > 0 || parseNumber(order.advancePaid) > 0) && (
          <div className="border-t border-black border-dashed mt-4 pt-2 text-xs">
            <div className="flex justify-between font-bold text-sm mb-1">
              <span>Paid</span>
              <span>₹{(parseNumber(order.paidAmount) || parseNumber(order.advancePaid)).toFixed(2)}</span>
            </div>
            {(parseNumber(order.pendingBalance) > 0) && (
              <div className="flex justify-between font-black text-sm mt-1 bg-gray-100 p-1">
                <span>BALANCE DUE</span>
                <span>₹{parseNumber(order.pendingBalance).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-6 text-[10px] border-t border-black border-dashed pt-4">
          <p className="font-bold text-xs">Thank You For Choosing Us!</p>
          <p className="mt-1">Follow us on IG @gopalcakeshop</p>
        </div>
      </div>
    </>
  )
}
