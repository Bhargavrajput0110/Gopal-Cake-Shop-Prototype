import { jsPDF } from 'jspdf';

export interface InvoiceItem {
  name: string;
  qty: number;
  weight?: string;
  flavor?: string;
  price: number;
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
  createdAt?: string;
  branchName?: string;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Top Accent Header Line (Gold & Dark Brown)
  doc.setFillColor(62, 39, 35); // #3E2723
  doc.rect(0, 0, 210, 6, 'F');
  doc.setFillColor(197, 160, 89); // #C5A059
  doc.rect(0, 6, 210, 1.5, 'F');

  // Gopal Cake Shop branding
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(62, 39, 35); // Theme color (#3E2723)
  doc.text('GOPAL CAKE SHOP', 20, 24);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(197, 160, 89); // Theme accent (#C5A059)
  doc.text('CRAFTING SWEET MOMENTS SINCE 1995', 20, 29);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.branchName || 'Uma Char Rasta Branch'} • Vadodara, Gujarat`, 20, 34);
  doc.text('Ph: +91 9898616894 | GSTIN: 24AAAFG0000A1Z2', 20, 39);

  // Title Box
  doc.setFontSize(16);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(62, 39, 35);
  doc.text('TAX INVOICE', 145, 24);

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Original for Recipient', 145, 29);

  // Horizontal Divider Line
  doc.setDrawColor(220, 210, 195);
  doc.setLineWidth(0.4);
  doc.line(20, 44, 190, 44);

  // Invoice & Customer Details Block
  doc.setFontSize(9.5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(62, 39, 35);
  doc.text('INVOICE DETAILS', 20, 51);
  doc.text('CUSTOMER / BILL TO', 120, 51);

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(70, 70, 70);

  doc.text(`Order No:  ${data.orderId}`, 20, 57);
  doc.text(`Date:         ${data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN')}`, 20, 62);
  doc.text(`Status:      CONFIRMED`, 20, 67);

  doc.setFont('Helvetica', 'bold');
  doc.text(data.customerName, 120, 57);
  doc.setFont('Helvetica', 'normal');
  if (data.customerPhone) {
    doc.text(`Phone: +91 ${data.customerPhone}`, 120, 62);
  }
  if (data.deliveryAddress) {
    const splitAddr = doc.splitTextToSize(`Address: ${data.deliveryAddress}`, 70);
    doc.text(splitAddr, 120, 67);
  } else {
    doc.text('Type: Store Pickup', 120, 67);
  }

  // Items Header Table
  let y = 82;
  doc.setFillColor(62, 39, 35);
  doc.rect(20, y, 170, 8, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('ITEM DESCRIPTION', 24, y + 5.5);
  doc.text('FLAVOR', 85, y + 5.5);
  doc.text('WEIGHT', 115, y + 5.5);
  doc.text('QTY', 140, y + 5.5);
  doc.text('PRICE', 155, y + 5.5);
  doc.text('TOTAL', 175, y + 5.5);

  y += 8;

  // Item List
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  data.items.forEach((item, index) => {
    y += 8;
    // Check page overflow
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Alternating Row Background
    if (index % 2 === 0) {
      doc.setFillColor(252, 250, 246);
      doc.rect(20, y - 5.5, 170, 7.5, 'F');
    }

    const itemTotal = item.price * item.qty;
    doc.text(item.name.substring(0, 30), 24, y);
    doc.text(item.flavor || '-', 85, y);
    doc.text(item.weight || '-', 115, y);
    doc.text(item.qty.toString(), 140, y);
    doc.text(`₹${item.price.toFixed(2)}`, 155, y);
    doc.text(`₹${itemTotal.toFixed(2)}`, 175, y);
  });

  // Divider
  y += 6;
  doc.setDrawColor(200, 190, 175);
  doc.line(20, y, 190, y);

  // Summary Table (Right Aligned)
  y += 8;
  doc.setFontSize(9.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  doc.text('Subtotal:', 130, y);
  doc.text(`₹${data.subtotal.toFixed(2)}`, 175, y);

  if (data.deliveryCharge && data.deliveryCharge > 0) {
    y += 6;
    doc.text('Delivery Fee:', 130, y);
    doc.text(`₹${data.deliveryCharge.toFixed(2)}`, 175, y);
  }

  if (data.discount && data.discount > 0) {
    y += 6;
    doc.setTextColor(34, 139, 34); // Green
    doc.text('Discount:', 130, y);
    doc.text(`- ₹${data.discount.toFixed(2)}`, 175, y);
    doc.setTextColor(80, 80, 80);
  }

  // Grand Total Box
  y += 8;
  doc.setFillColor(247, 241, 230);
  doc.rect(125, y - 5, 65, 9, 'F');
  doc.setDrawColor(197, 160, 89);
  doc.rect(125, y - 5, 65, 9, 'D');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(62, 39, 35);
  doc.text('Grand Total:', 128, y + 1);
  doc.text(`₹${data.grandTotal.toFixed(2)}`, 172, y + 1);

  // Footer & Terms
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(62, 39, 35);
  doc.text('Thank you for choosing Gopal Cake Shop!', 20, 272);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('For queries or support, reach us at contact@gopalcakeshop.com or visit www.gopalcakeshop.com', 20, 277);
  doc.text('This is a computer generated invoice and does not require a physical signature.', 20, 282);

  // Bottom Gold Bar
  doc.setFillColor(197, 160, 89);
  doc.rect(0, 292, 210, 5, 'F');

  return doc;
}

