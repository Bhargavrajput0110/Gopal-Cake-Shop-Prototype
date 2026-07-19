import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { Printer } from "iconsax-react"

interface ReceiptStubProps {
  orderId: string
}

export function ReceiptStub({ orderId }: ReceiptStubProps) {
  // Fetch order details for the receipt
  const { data: order, isLoading } = useQuery({
    queryKey: ['receipt', orderId],
    queryFn: () => fetchClient<any>(`/orders/${orderId}`)
  })

  if (isLoading || !order) return null

  const handlePrint = () => {
    window.print()
  }

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
        <div className="text-center mb-4">
          <h1 className="text-xl font-black uppercase">Gopal Cake Shop</h1>
          <p className="text-xs">123 Bakery Lane, City</p>
          <p className="text-xs">Ph: +91 9876543210</p>
          <p className="text-xs mt-1">GSTIN: 27ABCDE1234F1Z5</p>
        </div>

        <div className="border-t border-b border-black border-dashed py-2 mb-4 text-xs">
          <div className="flex justify-between">
            <span>Order No:</span>
            <span className="font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Placed:</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold mt-1 pt-1 border-t border-black border-dashed">
            <span>Fulfillment:</span>
            <span>{new Date(order.targetDate).toLocaleString()}</span>
          </div>
          {order.customer && order.customer.name !== 'Walk-in' && order.customer.name !== 'walkin@gopalcakeshop.com' && (
            <div className="flex justify-between mt-1 pt-1 border-t border-black border-dashed">
              <span>Customer:</span>
              <span>{order.customer.name} ({order.customer.phone})</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between font-bold border-b border-black pb-1 mb-2 text-xs">
            <span>Item</span>
            <span>Amt</span>
          </div>
          {order.items?.map((item: any) => (
            <div key={item.id} className="mb-2 text-xs">
              <div className="flex justify-between">
                <span>{item.quantity}x {item.productName}</span>
                <span>{(item.price * item.quantity).toFixed(2)}</span>
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
            <span>{order.subtotal?.toFixed(2)}</span>
          </div>
          {((order.discount || 0) > 0) && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{Number(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{(Number(order.totalAmount || 0) - Number(order.subtotal || 0) + Number(order.discount || 0)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-black mt-2 pt-2 border-t border-black">
            <span>TOTAL</span>
            <span>₹{order.totalAmount?.toFixed(2)}</span>
          </div>
        </div>
        
        {order.payments && order.payments.length > 0 && (
          <div className="border-t border-black border-dashed mt-4 pt-2 text-xs">
            <div className="flex justify-between font-bold text-sm mb-1">
              <span>Advance Paid ({order.payments[0].method})</span>
              <span>₹{order.payments[0].amount.toFixed(2)}</span>
            </div>
            {order.payments[0].amount < order.totalAmount && (
              <div className="flex justify-between font-black text-sm mt-1 bg-gray-100 p-1">
                <span>BALANCE DUE</span>
                <span>₹{(order.totalAmount - order.payments[0].amount).toFixed(2)}</span>
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
