"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/api/client";
import { Printer, DocumentDownload, CloseSquare, TickCircle } from "iconsax-react";
import { generateInvoicePDF } from "@/lib/invoice";

interface ReceiptStubProps {
  orderId: string;
  onClose?: () => void;
}

export function ReceiptStub({ orderId, onClose }: ReceiptStubProps) {
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["receipt", orderId],
    queryFn: () => fetchClient<any>(`/orders/${orderId}`),
  });

  if (isLoading || !responseData) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          fontFamily: "'Georgia', serif",
          color: "#8B6914",
          fontSize: 14,
          letterSpacing: "0.05em",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #C5A059",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        Preparing your premium receipt...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const order = responseData.data || responseData;
  if (!order || !order.orderNumber) return null;

  const parseNumber = (val: any) => Number(val || 0);
  const subtotal = parseNumber(order.subtotal);
  const deliveryCharge = parseNumber(order.deliveryCharge);
  const discount = parseNumber(order.discount);
  const totalAmount = parseNumber(order.totalAmount || order.grandTotal);
  const paidAmount = parseNumber(order.paidAmount || order.advancePaid);
  const pendingBalance = parseNumber(order.pendingBalance || totalAmount - paidAmount);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    try {
      const invoiceItems = (order.items || []).map((item: any) => ({
        name: item.productName || item.name || "Custom Cake",
        qty: Number(item.quantity || item.qty || 1),
        weight: item.weight || "1kg",
        flavor: item.flavor || item.flavour || "Standard",
        price: Number(item.price || 0),
        messageOnCake: item.messageOnCake,
        designName: item.designName,
      }));
      const doc = generateInvoicePDF({
        orderId: order.orderNumber || order.id,
        customerName: order.customer?.name || order.customerName || "Valued Customer",
        customerPhone: order.customer?.phone || order.customerPhone,
        deliveryAddress: order.deliveryAddress || order.customer?.address,
        items: invoiceItems,
        subtotal,
        deliveryCharge,
        discount,
        grandTotal: totalAmount,
        paidAmount,
        pendingBalance,
        createdAt: order.createdAt,
        targetDate: order.targetDate,
        deliveryType: order.deliveryType,
        branchName: order.branch?.name,
        branchPhone: order.branch?.phone,
        branchAddress: order.branch?.address,
      });
      doc.save(`Invoice-${order.orderNumber || order.id}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Unable to download PDF. Try printing instead.");
    }
  };

  // ─── Styles ───────────────────────────────────────────────
  const BROWN = "#3E2723";
  const GOLD = "#C5A059";
  const CREAM = "#FFFDF7";
  const LIGHT_GOLD = "#F7F1E3";

  return (
    <>
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap');

          @media print {
            body * { visibility: hidden !important; }
            #receipt-stub, #receipt-stub * { visibility: visible !important; }
            #receipt-stub {
              position: fixed !important;
              left: 0 !important; top: 0 !important;
              width: 80mm !important;
              padding: 3mm 5mm !important;
              margin: 0 !important;
              background: #fff !important;
              color: #000 !important;
              font-family: 'Inter', 'Segoe UI', sans-serif !important;
              box-shadow: none !important;
              border: none !important;
            }
            .print-hidden { display: none !important; }
            .print-logo { width: 14mm !important; height: 14mm !important; }
            .print-ornament { display: none !important; }
          }

          .receipt-card {
            background: linear-gradient(160deg, #FFFFFF 0%, #FFFDF7 50%, #FFF9EF 100%);
            border: 1px solid rgba(197,160,89,0.35);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 8px 48px rgba(62,39,35,0.12), 0 2px 8px rgba(197,160,89,0.08);
            max-width: 440px;
            margin: 0 auto;
            font-family: 'Inter', 'Segoe UI', sans-serif;
            position: relative;
          }

          .receipt-top-bar {
            background: linear-gradient(90deg, #3E2723, #5D3A2E, #3E2723);
            height: 6px;
          }

          .receipt-gold-bar {
            background: linear-gradient(90deg, #C5A059, #E8C97A, #C5A059);
            height: 2px;
          }

          .receipt-header {
            background: linear-gradient(135deg, #3E2723 0%, #5D3A2E 60%, #3E2723 100%);
            padding: 24px 24px 20px;
            text-align: center;
            position: relative;
          }

          .receipt-header::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 40px;
            background: linear-gradient(to bottom right, transparent 49%, #FFFDF7 50%),
                        linear-gradient(to bottom left, transparent 49%, #FFFDF7 50%);
            background-size: 50% 100%;
            background-repeat: no-repeat;
            background-position: left, right;
          }

          .receipt-logo-ring {
            width: 80px; height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #C5A059, #E8C97A, #C5A059);
            padding: 3px;
            margin: 0 auto 12px;
            box-shadow: 0 4px 24px rgba(197,160,89,0.5);
          }

          .receipt-logo-inner {
            width: 100%; height: 100%;
            border-radius: 50%;
            background: #fff;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden;
          }

          .receipt-shop-name {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 20px;
            font-weight: 900;
            color: #fff;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            margin: 0 0 4px;
            text-shadow: 0 1px 4px rgba(0,0,0,0.3);
          }

          .receipt-tagline {
            font-size: 10px;
            font-weight: 600;
            color: #C5A059;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin: 0;
          }

          .ornament {
            color: #C5A059;
            font-size: 14px;
            opacity: 0.8;
            user-select: none;
          }

          .receipt-body { padding: 20px 20px 16px; }

          .receipt-branch-row {
            text-align: center;
            margin-bottom: 16px;
          }

          .badge-row {
            background: ${LIGHT_GOLD};
            border: 1px solid rgba(197,160,89,0.3);
            border-radius: 12px;
            padding: 12px 14px;
            margin-bottom: 12px;
            font-size: 11px;
          }

          .badge-row-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3px 0;
          }

          .badge-row-item + .badge-row-item {
            border-top: 1px dashed rgba(197,160,89,0.3);
            padding-top: 5px;
            margin-top: 2px;
          }

          .label-text { color: #8B7355; font-weight: 500; }
          .value-text { color: #2B1810; font-weight: 700; font-family: 'Inter', monospace; }

          .order-number-badge {
            background: linear-gradient(135deg, #3E2723, #5D3A2E);
            color: #C5A059;
            font-weight: 800;
            padding: 2px 10px;
            border-radius: 20px;
            font-family: 'Inter', monospace;
            letter-spacing: 0.05em;
            font-size: 11px;
          }

          .section-title {
            font-size: 9px;
            font-weight: 800;
            color: ${GOLD};
            letter-spacing: 0.2em;
            text-transform: uppercase;
            margin: 0 0 6px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .section-title::before, .section-title::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(197,160,89,0.4));
          }
          .section-title::after { transform: scaleX(-1); }

          .item-row {
            padding: 8px 0;
            border-bottom: 1px dashed rgba(197,160,89,0.2);
          }

          .item-row:last-child { border-bottom: none; }

          .item-name {
            font-weight: 700;
            color: #2B1810;
            font-size: 12px;
            margin-bottom: 2px;
          }

          .item-meta {
            font-size: 10px;
            color: #7B6248;
            padding-left: 8px;
            line-height: 1.5;
          }

          .item-price {
            font-weight: 800;
            color: #3E2723;
            font-size: 12px;
            white-space: nowrap;
          }

          .cake-message {
            background: linear-gradient(135deg, #FFF8E7, #FFFDF7);
            border: 1px solid rgba(197,160,89,0.3);
            border-left: 3px solid #C5A059;
            border-radius: 6px;
            padding: 5px 8px;
            margin-top: 4px;
            font-family: Georgia, serif;
            font-style: italic;
            font-size: 10px;
            color: #5D3A2E;
          }

          .totals-section {
            background: ${LIGHT_GOLD};
            border: 1px solid rgba(197,160,89,0.25);
            border-radius: 12px;
            padding: 12px 14px;
            margin-top: 12px;
            font-size: 11px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            color: #6B5340;
          }

          .grand-total-box {
            background: linear-gradient(135deg, #3E2723, #5D3A2E);
            border-radius: 10px;
            padding: 10px 14px;
            margin-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .grand-total-label { color: #C5A059; font-weight: 700; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
          .grand-total-value { color: #fff; font-weight: 900; font-size: 16px; }

          .payment-section {
            margin-top: 10px;
            border-top: 1px dashed rgba(197,160,89,0.3);
            padding-top: 10px;
          }

          .paid-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #3E2723;
            font-weight: 600;
            margin-bottom: 6px;
          }

          .balance-due {
            background: linear-gradient(135deg, #FFF5F5, #FFF8F8);
            border: 1px solid rgba(220, 50, 50, 0.25);
            border-left: 3px solid #DC3545;
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: 800;
            color: #B91C1C;
          }

          .paid-full {
            background: linear-gradient(135deg, #F0FDF4, #F0FFF4);
            border: 1px solid rgba(34,197,94,0.3);
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 800;
            color: #15803D;
          }

          .receipt-footer {
            text-align: center;
            padding: 16px 20px 20px;
            border-top: 1px dashed rgba(197,160,89,0.3);
            margin-top: 8px;
          }

          .footer-thanks {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 13px;
            font-weight: 700;
            color: #3E2723;
            margin-bottom: 4px;
          }

          .footer-sub {
            font-size: 9.5px;
            color: #8B7355;
            line-height: 1.5;
          }

          .footer-socials {
            display: flex;
            justify-content: center;
            gap: 16px;
            margin-top: 10px;
            font-size: 9px;
            font-weight: 600;
            color: #7B6248;
          }

          .receipt-bottom-bar {
            height: 5px;
            background: linear-gradient(90deg, #3E2723, #C5A059, #3E2723);
          }
        `
      }} />

      {/* ── Control Bar ── */}
      <div
        className="print-hidden"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 16,
          background: "linear-gradient(135deg, rgba(62,39,35,0.06), rgba(197,160,89,0.06))",
          border: "1px solid rgba(197,160,89,0.25)",
          borderRadius: 14,
          padding: "10px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px",
                background: BROWN, color: "#fff",
                border: "none", borderRadius: 8,
                fontSize: 11, fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#2C1C19")}
              onMouseLeave={e => (e.currentTarget.style.background = BROWN)}
            >
              <CloseSquare size={14} color={GOLD} />
              Back
            </button>
          )}
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", display: "inline-block", boxShadow: "0 0 6px #22C55E" }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: BROWN, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Official Receipt
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleDownloadPDF}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px",
              background: "#fff",
              border: `1px solid rgba(197,160,89,0.4)`,
              color: BROWN, borderRadius: 8,
              fontSize: 11, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 1px 4px rgba(62,39,35,0.08)",
            }}
          >
            <DocumentDownload size={14} color={GOLD} />
            PDF Invoice
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 16px",
              background: `linear-gradient(135deg, ${BROWN}, #5D3A2E)`,
              color: "#fff", border: "none", borderRadius: 8,
              fontSize: 11, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 2px 10px rgba(62,39,35,0.3)",
            }}
          >
            <Printer size={14} color={GOLD} />
            Print (80mm)
          </button>
        </div>
      </div>

      {/* ── Premium Receipt Card ── */}
      <div id="receipt-stub" className="receipt-card">

        {/* Top Bars */}
        <div className="receipt-top-bar" />
        <div className="receipt-gold-bar" />

        {/* Dark Header with Logo */}
        <div className="receipt-header">
          <div className="receipt-logo-ring">
            <div className="receipt-logo-inner">
              <img
                src="/logo.png"
                alt="Gopal Cake Shop"
                className="print-logo"
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }}
              />
            </div>
          </div>
          <h1 className="receipt-shop-name">Gopal Cake Shop</h1>
          <p className="receipt-tagline">✦ Crafting Sweet Moments Since 1990 ✦</p>
        </div>

        {/* Body */}
        <div className="receipt-body">

          {/* Branch Info */}
          <div className="receipt-branch-row">
            <div style={{ fontSize: 11, fontWeight: 700, color: BROWN, marginBottom: 2 }}>
              {order.branch?.name ? `${order.branch.name} Branch` : "Uma Char Rasta Branch"}
            </div>
            <div style={{ fontSize: 10, color: "#7B6248", lineHeight: 1.5 }}>
              {order.branch?.address || "Waghodia Road, Vadodara, Gujarat"}
            </div>
            <div style={{ fontSize: 10, color: "#7B6248" }}>
              Ph: {order.branch?.phone ? `+91 ${order.branch.phone}` : "+91 9898616894"} &nbsp;|&nbsp; GSTIN: 24AAAFG0000A1Z2
            </div>
          </div>

          {/* Ornamental divider */}
          <div style={{ textAlign: "center", marginBottom: 12, fontSize: 11, color: GOLD, letterSpacing: 6, userSelect: "none" }}>
            ── ✦ ──
          </div>

          {/* Order Details Badge */}
          <div className="badge-row">
            <div className="badge-row-item">
              <span className="label-text">Bill No</span>
              <span className="order-number-badge">{order.orderNumber}</span>
            </div>
            <div className="badge-row-item">
              <span className="label-text">Order Date</span>
              <span className="value-text">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                  : "—"}
              </span>
            </div>
            <div className="badge-row-item">
              <span className="label-text">Target Date</span>
              <span className="value-text">
                {order.targetDate
                  ? new Date(order.targetDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                  : "—"}
              </span>
            </div>
            <div className="badge-row-item">
              <span className="label-text">Type</span>
              <span className="value-text">
                {order.deliveryType === "DELIVERY" ? "🚗 Home Delivery" : "🏬 Store Pickup"}
              </span>
            </div>

            {/* Customer */}
            {order.customer && (
              <>
                <div className="badge-row-item" style={{ marginTop: 4 }}>
                  <span className="label-text">Customer</span>
                  <span className="value-text">{order.customer.name || "Walk-in"}</span>
                </div>
                {order.customer.phone && (
                  <div className="badge-row-item">
                    <span className="label-text">Phone</span>
                    <span className="value-text">+91 {order.customer.phone}</span>
                  </div>
                )}
              </>
            )}

            {/* Delivery Address */}
            {(order.deliveryAddress || order.customer?.address) && (
              <div style={{ paddingTop: 8, borderTop: "1px dashed rgba(197,160,89,0.3)", marginTop: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 3 }}>
                  Delivery Address
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#2B1810", lineHeight: 1.4 }}>
                  {order.deliveryAddress || order.customer?.address}
                </div>
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="section-title" style={{ fontSize: 9, fontWeight: 800, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, margin: "14px 0 8px" }}>
            <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(197,160,89,0.4))" }} />
            Order Items
            <span style={{ flex: 1, height: 1, background: "linear-gradient(270deg, transparent, rgba(197,160,89,0.4))" }} />
          </div>

          <div style={{ borderTop: `2px solid ${BROWN}`, paddingTop: 8 }}>
            {(order.items || []).map((item: any, idx: number) => (
              <div key={item.id || idx} className="item-row">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="item-name">
                    {item.quantity}× {item.productName || item.name}
                  </div>
                  <div className="item-price">
                    ₹{(parseNumber(item.price) * parseNumber(item.quantity)).toFixed(2)}
                  </div>
                </div>
                <div className="item-meta">
                  {item.weight && <span>Weight: <strong>{item.weight}</strong></span>}
                  {item.weight && item.flavor && <span> &nbsp;·&nbsp; </span>}
                  {item.flavor && <span>Flavor: <strong>{item.flavor}</strong></span>}
                  {item.designName && (
                    <div>Design: <em>{item.designName}</em>{item.designCode ? ` (${item.designCode})` : ""}</div>
                  )}
                </div>
                {item.messageOnCake && (
                  <div className="cake-message">
                    &ldquo;{item.messageOnCake}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="totals-section">
            {subtotal > 0 && (
              <div className="total-row">
                <span>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
              </div>
            )}
            {deliveryCharge > 0 && (
              <div className="total-row">
                <span>Delivery Charge</span>
                <span style={{ fontWeight: 600 }}>₹{deliveryCharge.toFixed(2)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="total-row" style={{ color: "#15803D", fontWeight: 700 }}>
                <span>🎁 Discount</span>
                <span>−₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="grand-total-box">
              <span className="grand-total-label">Total Amount</span>
              <span className="grand-total-value">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="payment-section">
            <div className="paid-row">
              <span>Advance / Paid</span>
              <span style={{ color: "#15803D", fontWeight: 800 }}>₹{paidAmount.toFixed(2)}</span>
            </div>
            {pendingBalance > 0 ? (
              <div className="balance-due">
                <span>⚠️ Balance Due at Pickup</span>
                <span>₹{pendingBalance.toFixed(2)}</span>
              </div>
            ) : (
              <div className="paid-full">
                <TickCircle size={15} color="#16A34A" />
                Full Payment Received
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="receipt-footer">
          <p className="footer-thanks">Thank You for Celebrating With Us! 🎂</p>
          <p className="footer-sub">Please verify your order items before leaving the counter.</p>
          <div className="footer-socials">
            <span>📷 @gopalcakeshop</span>
            <span>·</span>
            <span>🌐 gopalcakeshop.com</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="receipt-bottom-bar" />
      </div>
    </>
  );
}
