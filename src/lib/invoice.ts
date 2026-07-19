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
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Gopal Bakery branding
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(56, 37, 30); // Theme color (#38251E)
  doc.text('GOPAL BAKERY', 20, 25);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Premium Custom Cakes & Desserts', 20, 30);
  doc.text('Vadodara, Gujarat', 20, 35);

  doc.setFontSize(18);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(56, 37, 30);
  doc.text('INVOICE', 140, 25);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);

  // Invoice Details
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  doc.text(`Order ID: ${data.orderId}`, 20, 50);
  doc.text(`Date: ${data.createdAt ? new Date(data.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 20, 56);

  // Customer Details
  doc.setFont('Helvetica', 'bold');
  doc.text('Bill To:', 120, 50);
  doc.setFont('Helvetica', 'normal');
  doc.text(data.customerName, 120, 56);
  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, 120, 62);
  }
  if (data.deliveryAddress) {
    doc.text(`Address: ${data.deliveryAddress}`, 120, 68);
  }

  // Items Header
  let y = 80;
  doc.setFillColor(245, 240, 238);
  doc.rect(20, y, 170, 8, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.text('Item Description', 22, y + 5);
  doc.text('Flavor', 80, y + 5);
  doc.text('Weight', 110, y + 5);
  doc.text('Qty', 135, y + 5);
  doc.text('Price', 150, y + 5);
  doc.text('Total', 170, y + 5);

  y += 8;

  // Item List
  doc.setFont('Helvetica', 'normal');
  data.items.forEach((item) => {
    y += 8;
    // Check page overflow
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const itemTotal = item.price * item.qty;
    doc.text(item.name, 22, y);
    doc.text(item.flavor || '-', 80, y);
    doc.text(item.weight || '-', 110, y);
    doc.text(item.qty.toString(), 135, y);
    doc.text(`INR ${item.price.toFixed(2)}`, 150, y);
    doc.text(`INR ${itemTotal.toFixed(2)}`, 170, y);
  });

  // Divider
  y += 5;
  doc.line(20, y, 190, y);

  // Totals
  y += 10;
  doc.text('Subtotal:', 130, y);
  doc.text(`INR ${data.subtotal.toFixed(2)}`, 170, y);

  if (data.deliveryCharge) {
    y += 6;
    doc.text('Delivery Charge:', 130, y);
    doc.text(`INR ${data.deliveryCharge.toFixed(2)}`, 170, y);
  }

  if (data.discount) {
    y += 6;
    doc.text('Discount:', 130, y);
    doc.text(`- INR ${data.discount.toFixed(2)}`, 170, y);
  }

  y += 8;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Grand Total:', 130, y);
  doc.text(`INR ${data.grandTotal.toFixed(2)}`, 170, y);

  // Footer
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for ordering with Gopal Bakery!', 20, 280);

  return doc;
}
