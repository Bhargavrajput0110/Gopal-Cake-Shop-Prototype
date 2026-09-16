import { jsPDF } from 'jspdf';

export interface InvoiceItem {
  name: string;
  qty: number;
  weight?: string;
  flavor?: string;
  price: number;
  messageOnCake?: string;
  designName?: string;
}

export interface InvoiceData {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  deliveryCharge?: number;
  discount?: number;
  grandTotal: number;
  paidAmount?: number;
  pendingBalance?: number;
  createdAt?: string;
  targetDate?: string;
  deliveryType?: string;
  branchName?: string;
  branchPhone?: string;
  branchAddress?: string;
}

// Helper: draw rounded rectangle
function roundedRect(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  r: number, style: 'F' | 'D' | 'FD' = 'F'
) {
  doc.roundedRect(x, y, w, h, r, r, style);
}

// Helper: draw a horizontal rule
function hRule(doc: jsPDF, x1: number, x2: number, y: number, color: [number, number, number], width = 0.3) {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(x1, y, x2, y);
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210; // page width
  const MARGIN = 18;
  const CONTENT_W = W - MARGIN * 2;

  // ─── COLORS ─────────────────────────────────────────────
  const BROWN: [number, number, number] = [62, 39, 35];
  const BROWN_MID: [number, number, number] = [93, 58, 46];
  const GOLD: [number, number, number] = [197, 160, 89];
  const GOLD_LIGHT: [number, number, number] = [247, 241, 230];
  const CREAM: [number, number, number] = [255, 253, 247];
  const GRAY: [number, number, number] = [100, 90, 80];
  const GRAY_LIGHT: [number, number, number] = [230, 220, 208];
  const WHITE: [number, number, number] = [255, 255, 255];
  const GREEN: [number, number, number] = [21, 128, 61];
  const RED: [number, number, number] = [185, 28, 28];

  // ─── TOP DARK HEADER BAND ───────────────────────────────
  doc.setFillColor(...BROWN);
  doc.rect(0, 0, W, 38, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 38, W, 1.5, 'F');

  // ─── LOGO (top-left in header) ──────────────────────────
  // Draw circular gold logo ring
  doc.setFillColor(...GOLD);
  doc.circle(MARGIN + 10, 19, 11, 'F');
  doc.setFillColor(...WHITE);
  doc.circle(MARGIN + 10, 19, 10, 'F');

  // Try to add the logo image from public folder
  try {
    // Use fetch to embed logo as base64 in PDF — deferred to browser
    // We'll place a text cake emoji as fallback
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...BROWN);
    doc.text('🎂', MARGIN + 10, 20.5, { align: 'center' });
  } catch (_) { /* skip */ }

  // ─── SHOP NAME & TAGLINE (centered in header) ────────────
  const headerCenterX = (W + MARGIN + 22) / 2 + 5;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text('GOPAL CAKE SHOP', MARGIN + 22, 15);

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.text('CRAFTING SWEET MOMENTS SINCE 1990', MARGIN + 22, 21.5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 210, 195);
  const branchText = `${data.branchName || 'Uma Char Rasta Branch'}  •  ${data.branchAddress || 'Waghodia Road, Vadodara, Gujarat'}`;
  doc.text(branchText, MARGIN + 22, 27.5);
  doc.text(`Ph: +91 ${data.branchPhone || '9898616894'}   |   GSTIN: 24AAAFG0000A1Z2`, MARGIN + 22, 32.5);

  // ─── TAX INVOICE label (top-right) ──────────────────────
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...GOLD);
  doc.text('TAX INVOICE', W - MARGIN, 18, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(200, 185, 165);
  doc.text('Original for Recipient', W - MARGIN, 23.5, { align: 'right' });

  // ─── ORDER & CUSTOMER DETAILS ────────────────────────────
  let y = 48;

  // Two-column info block background
  doc.setFillColor(...CREAM);
  roundedRect(doc, MARGIN, y, CONTENT_W, 38, 3, 'F');
  doc.setDrawColor(...GOLD_LIGHT);
  doc.setLineWidth(0.3);
  roundedRect(doc, MARGIN, y, CONTENT_W, 38, 3, 'D');

  // Left col — Invoice Details
  const col1X = MARGIN + 5;
  const col2X = MARGIN + CONTENT_W / 2 + 4;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD);
  doc.text('INVOICE DETAILS', col1X, y + 7);

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(...GRAY);

  const orderDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN');
  const targetDate = data.targetDate
    ? new Date(data.targetDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const detailRows = [
    ['Order No', data.orderId],
    ['Order Date', orderDate],
    ['Target Date', targetDate],
    ['Status', 'CONFIRMED'],
  ];

  detailRows.forEach(([label, val], i) => {
    const rowY = y + 15 + i * 6;
    doc.setTextColor(...GRAY);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${label}:`, col1X, rowY);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BROWN);
    doc.text(val, col1X + 28, rowY);
  });

  // Right col — Customer Details
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD);
  doc.text('BILL TO', col2X, y + 7);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BROWN);
  doc.text(data.customerName, col2X, y + 15);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  if (data.customerPhone) {
    doc.text(`Phone: +91 ${data.customerPhone}`, col2X, y + 21);
  }
  if (data.deliveryAddress) {
    const addrLines = doc.splitTextToSize(`Address: ${data.deliveryAddress}`, CONTENT_W / 2 - 8);
    doc.text(addrLines, col2X, y + 27);
  } else {
    doc.text(`Type: ${data.deliveryType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}`, col2X, y + 27);
  }

  // Vertical divider
  doc.setDrawColor(...GOLD_LIGHT);
  doc.setLineWidth(0.4);
  doc.line(MARGIN + CONTENT_W / 2, y + 5, MARGIN + CONTENT_W / 2, y + 35);

  y += 46;

  // ─── ITEMS TABLE ─────────────────────────────────────────
  // Header Row
  doc.setFillColor(...BROWN);
  roundedRect(doc, MARGIN, y, CONTENT_W, 9, 2, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('ITEM DESCRIPTION', MARGIN + 4, y + 6);
  doc.text('FLAVOR', MARGIN + 82, y + 6);
  doc.text('WEIGHT', MARGIN + 107, y + 6);
  doc.text('QTY', MARGIN + 130, y + 6);
  doc.text('UNIT PRICE', MARGIN + 140, y + 6);
  doc.text('TOTAL', MARGIN + 162, y + 6);

  y += 9;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);

  data.items.forEach((item, index) => {
    const rowH = item.messageOnCake || item.designName ? 14 : 9;

    if (y + rowH > 262) {
      doc.addPage();
      y = 20;
    }

    // Alternating row bg
    if (index % 2 === 0) {
      doc.setFillColor(...CREAM);
    } else {
      doc.setFillColor(...GOLD_LIGHT);
    }
    doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');

    const itemTotal = item.price * item.qty;
    doc.setTextColor(...BROWN);
    doc.setFont('Helvetica', 'bold');
    doc.text(item.name.substring(0, 28), MARGIN + 4, y + 6);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(item.flavor || '—', MARGIN + 82, y + 6);
    doc.text(item.weight || '—', MARGIN + 107, y + 6);
    doc.text(item.qty.toString(), MARGIN + 132, y + 6, { align: 'center' });
    doc.text(`₹${item.price.toFixed(2)}`, MARGIN + 155, y + 6, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(...BROWN);
    doc.text(`₹${itemTotal.toFixed(2)}`, MARGIN + 171, y + 6, { align: 'right' });

    // Sub-details
    if (item.designName) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text(`Design: ${item.designName}`, MARGIN + 8, y + 11);
    }
    if (item.messageOnCake) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(93, 58, 46);
      const msgY = item.designName ? y + 15 : y + 11;
      doc.text(`"${item.messageOnCake}"`, MARGIN + 8, msgY);
    }

    doc.setFontSize(8.5);
    y += rowH;
  });

  // Table bottom border
  hRule(doc, MARGIN, MARGIN + CONTENT_W, y, BROWN, 0.5);
  y += 8;

  // ─── SUMMARY BLOCK ───────────────────────────────────────
  const summaryX = MARGIN + CONTENT_W - 80;
  const summaryW = 80;

  // Summary background
  doc.setFillColor(...CREAM);
  roundedRect(doc, summaryX, y, summaryW, 8, 1.5, 'F');

  const summaryRows: [string, string, boolean?][] = [];
  if (data.subtotal > 0) summaryRows.push(['Subtotal', `₹${data.subtotal.toFixed(2)}`]);
  if (data.deliveryCharge && data.deliveryCharge > 0) summaryRows.push(['Delivery Fee', `₹${data.deliveryCharge.toFixed(2)}`]);
  if (data.discount && data.discount > 0) summaryRows.push([`Discount`, `- ₹${data.discount.toFixed(2)}`, true]);

  let sy = y + 6;
  summaryRows.forEach(([label, val, isDiscount]) => {
    doc.setFillColor(...CREAM);
    doc.rect(summaryX, sy - 5, summaryW, 7.5, 'F');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(isDiscount ? GREEN[0] : GRAY[0], isDiscount ? GREEN[1] : GRAY[1], isDiscount ? GREEN[2] : GRAY[2]);
    doc.text(label, summaryX + 3, sy);
    doc.setFont('Helvetica', 'bold');
    doc.text(val, summaryX + summaryW - 3, sy, { align: 'right' });
    sy += 8;
  });

  // Grand Total Box
  sy += 2;
  doc.setFillColor(...BROWN);
  roundedRect(doc, summaryX, sy, summaryW, 12, 2, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  roundedRect(doc, summaryX, sy, summaryW, 12, 2, 'D');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text('Grand Total:', summaryX + 3, sy + 8);
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.text(`₹${data.grandTotal.toFixed(2)}`, summaryX + summaryW - 3, sy + 8.5, { align: 'right' });

  sy += 18;

  // Payment Status
  if ((data.paidAmount ?? 0) > 0) {
    doc.setFillColor(240, 253, 244);
    roundedRect(doc, summaryX, sy, summaryW, 8, 1.5, 'F');
    doc.setDrawColor(134, 239, 172);
    doc.setLineWidth(0.3);
    roundedRect(doc, summaryX, sy, summaryW, 8, 1.5, 'D');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GREEN);
    doc.text('Paid / Advance:', summaryX + 3, sy + 5.5);
    doc.setFont('Helvetica', 'bold');
    doc.text(`₹${(data.paidAmount ?? 0).toFixed(2)}`, summaryX + summaryW - 3, sy + 5.5, { align: 'right' });
    sy += 10;
  }

  if ((data.pendingBalance ?? 0) > 0) {
    doc.setFillColor(255, 241, 241);
    roundedRect(doc, summaryX, sy, summaryW, 9, 1.5, 'F');
    doc.setDrawColor(252, 165, 165);
    doc.setLineWidth(0.3);
    roundedRect(doc, summaryX, sy, summaryW, 9, 1.5, 'D');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...RED);
    doc.text('Balance Due:', summaryX + 3, sy + 6);
    doc.text(`₹${(data.pendingBalance ?? 0).toFixed(2)}`, summaryX + summaryW - 3, sy + 6, { align: 'right' });
  }

  // ─── FOOTER ──────────────────────────────────────────────
  const footerY = 274;

  hRule(doc, MARGIN, W - MARGIN, footerY - 4, GOLD_LIGHT, 0.4);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BROWN);
  doc.text('Thank you for celebrating with Gopal Cake Shop!', MARGIN, footerY + 2);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('contact@gopalcakeshop.com  |  www.gopalcakeshop.com  |  @gopalcakeshop', MARGIN, footerY + 7.5);
  doc.text('This is a computer-generated invoice. No physical signature required.', MARGIN, footerY + 12.5);

  // Bottom gold bar
  doc.setFillColor(...GOLD);
  doc.rect(0, 292, W, 3, 'F');
  doc.setFillColor(...BROWN);
  doc.rect(0, 295, W, 2, 'F');

  return doc;
}
