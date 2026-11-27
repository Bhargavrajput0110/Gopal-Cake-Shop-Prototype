/**
 * Gopal Cake Shop — Thermal Barcode Printing & PDF Generation Architecture
 * 
 * Milestone M1: Pure in-memory Code128 pattern generator without DOM/canvas,
 * RLE-compressed SVG generator, 50mm × 25mm direct thermal roll HTML formatters,
 * vector PDF generator using jsPDF, and barcode validator.
 */

import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';

// ============================================================================
// 1. INTERFACES & OPTIONS
// ============================================================================

export interface ThermalStickerData {
  itemName: string;
  barcode: string;
  price: number;
  variantWeight?: string;
  flavor?: string;
  packedDate: string;             // e.g. "21/11/2026" or "21/11/26 10:00"
  expiryDate: string;             // e.g. "24/11/2026"
  batchNumber?: string;
  branchCode?: 'VAR' | 'UMA' | 'KHD' | 'ELL' | string;
  isVeg?: boolean;                // default: true
  storageNotice?: string;         // default: "Keep Refrigerated"
  tagline?: string;               // default: "100% EGGLESS · VADODARA"
}

export interface BarcodeOptions {
  width?: number;                 // Module width in px (default: 2)
  height?: number;                // Barcode height in px (default: 35)
  displayValue?: boolean;         // Whether to render text in SVG (default: true)
  fontSize?: number;              // Font size in px (default: 11)
  font?: string;                  // Font family (default: 'monospace')
  margin?: number;                // Quiet zone margin in px (default: 4)
  background?: string;            // Background color (default: '#ffffff')
  lineColor?: string;             // Bar color (default: '#000000')
}

export interface StickerPrintOptions {
  includeRollCss?: boolean;
  title?: string;
  autoPrint?: boolean;
}

// ============================================================================
// 2. HELPER UTILITIES
// ============================================================================

/** XML/HTML entity escaping */
export function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Validates whether the given string is a valid barcode format.
 * Must be non-empty, between 3 and 48 characters, and contain only valid
 * Code128 ASCII printable characters (ASCII 32 to 126).
 */
export function validateBarcode(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 3 || trimmed.length > 48) return false;
  // Code128 supports printable ASCII (32-126)
  return /^[\x20-\x7E]+$/.test(trimmed);
}

/**
 * Pure in-memory Code128 pattern generator.
 * Does not require browser DOM, canvas, jsdom, or node-canvas.
 * Returns the binary pattern string (e.g. "110100100001101...") representing
 * bars ('1') and spaces ('0').
 */
export function getCode128Pattern(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Barcode text must be a non-empty string');
  }

  const trimmed = text.trim();
  if (!validateBarcode(trimmed)) {
    throw new Error(`Invalid barcode string "${text}". Must contain valid Code128 characters.`);
  }

  const dummyTarget: { encodings?: { data: string }[] } = {};
  JsBarcode(dummyTarget, trimmed, {
    format: 'CODE128',
    displayValue: false,
  });

  if (!dummyTarget.encodings || dummyTarget.encodings.length === 0 || !dummyTarget.encodings[0]?.data) {
    throw new Error(`Failed to encode barcode pattern for "${trimmed}"`);
  }

  return dummyTarget.encodings[0].data;
}

// ============================================================================
// 3. SVG GENERATION (WITH RLE COMPRESSION)
// ============================================================================

/**
 * Generates a standalone, XML-compliant SVG string for the given barcode text.
 * Utilizes Run-Length Encoding (RLE) to merge contiguous bar bits ('1's) into single
 * SVG <rect> elements, reducing SVG markup payload by ~60%.
 */
export function generateBarcodeSvg(text: string, options: BarcodeOptions = {}): string {
  const binaryPattern = getCode128Pattern(text);
  const {
    width = 2,
    height = 35,
    displayValue = true,
    fontSize = 11,
    font = 'monospace',
    margin = 4,
    background = '#ffffff',
    lineColor = '#000000',
  } = options;

  const totalContentWidth = binaryPattern.length * width;
  const totalWidth = margin * 2 + totalContentWidth;
  const textExtraHeight = displayValue ? fontSize + 4 : 0;
  const totalHeight = margin * 2 + height + textExtraHeight;

  const rects: string[] = [];
  let currentX = margin;
  let i = 0;

  // Run-Length Encoding (RLE) to collapse adjacent '1' bits into single <rect> elements
  while (i < binaryPattern.length) {
    const bit = binaryPattern[i];
    let runLength = 1;
    while (i + runLength < binaryPattern.length && binaryPattern[i + runLength] === bit) {
      runLength++;
    }

    const runWidth = runLength * width;
    if (bit === '1') {
      rects.push(
        `<rect x="${currentX.toFixed(2)}" y="${margin.toFixed(2)}" width="${runWidth.toFixed(2)}" height="${height.toFixed(2)}" fill="${lineColor}"/>`
      );
    }
    currentX += runWidth;
    i += runLength;
  }

  let textElement = '';
  if (displayValue) {
    const textY = margin + height + fontSize;
    const textX = totalWidth / 2;
    textElement = `<text x="${textX.toFixed(2)}" y="${textY.toFixed(2)}" text-anchor="middle" font-family="${escapeXml(font)}" font-size="${fontSize}" fill="${lineColor}" font-weight="600">${escapeXml(text)}</text>`;
  }

  const bgRect = background && background !== 'transparent'
    ? `<rect width="100%" height="100%" fill="${background}"/>`
    : '';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">`,
    bgRect,
    rects.join(''),
    textElement,
    `</svg>`,
  ].join('');
}

// ============================================================================
// 4. THERMAL STICKER HTML FORMATTERS (50mm × 25mm)
// ============================================================================

/**
 * Formats a single 50mm × 25mm thermal sticker HTML block.
 * Includes "GOPAL CAKE SHOP" header, statutory FSSAI green veg badge,
 * product title & variant weight, RLE vector SVG barcode, human readable code,
 * MRP in INR (₹), packed & expiry dates, branch code, and eggless tagline.
 */
export function formatThermalStickerHtml(unit: ThermalStickerData): string {
  const barcodeSvg = generateBarcodeSvg(unit.barcode, {
    width: 1.35,
    height: 24,
    margin: 1,
    displayValue: false,
    background: 'transparent',
    lineColor: '#000000',
  });

  const isVeg = unit.isVeg !== false;
  const vegBadge = isVeg
    ? `<span class="veg-badge" title="100% Vegetarian"><span class="veg-dot"></span></span>`
    : '';

  const weightStr = unit.variantWeight ? ` (${escapeXml(unit.variantWeight)})` : '';
  const itemTitle = `${escapeXml(unit.itemName)}${weightStr}`;
  const priceFormatted = `₹${unit.price.toFixed(2)}`;
  const branchAndBatch = `${escapeXml(unit.branchCode || 'VAR')}${unit.batchNumber ? ' · B:' + escapeXml(unit.batchNumber) : ''}`;
  const tagline = escapeXml(unit.tagline || '100% EGGLESS · VADODARA');

  return `
<div class="thermal-sticker">
  <div class="sticker-header">
    <span class="shop-name">GOPAL CAKE SHOP</span>
    ${vegBadge}
  </div>
  <div class="product-title" title="${itemTitle}">${itemTitle}</div>
  <div class="barcode-wrapper">
    <div class="barcode-graphic">${barcodeSvg}</div>
    <div class="barcode-text">${escapeXml(unit.barcode)}</div>
  </div>
  <div class="sticker-footer-row1">
    <span class="mrp-price">MRP: ${priceFormatted}</span>
    <span class="dates">Pkd:${escapeXml(unit.packedDate)} Exp:${escapeXml(unit.expiryDate)}</span>
  </div>
  <div class="sticker-footer-row2">
    <span class="branch-meta">${branchAndBatch}</span>
    <span class="tagline">${tagline}</span>
  </div>
</div>`.trim();
}

/**
 * Formats a continuous thermal roll printable HTML document for 50mm × 25mm labels.
 * Injects CSS `@page { size: 50mm 25mm; margin: 0; }` with zero printer margins,
 * strict page breaks between stickers, high contrast thermal rendering,
 * and responsive screen preview styling.
 */
export function formatThermalRollHtml(
  units: ThermalStickerData[],
  options: StickerPrintOptions = {}
): string {
  const { title = 'Gopal Cake Shop — Barcode Stickers', autoPrint = false } = options;
  const stickerHtmlList = units.map((u) => formatThermalStickerHtml(u)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(title)}</title>
  <style>
    /* 50mm x 25mm Direct Thermal Label Formatting */
    @page {
      size: 50mm 25mm;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #000000;
      background: #f3f4f6;
    }

    .thermal-sticker {
      width: 50mm;
      height: 25mm;
      max-width: 50mm;
      max-height: 25mm;
      padding: 1.2mm 1.8mm 1.0mm 1.8mm;
      background: #ffffff;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    /* Header: Shop Name & Veg Emblem */
    .sticker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      line-height: 1;
    }

    .shop-name {
      font-size: 7.2pt;
      font-weight: 900;
      letter-spacing: 0.3px;
      color: #000000;
    }

    .veg-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 8px;
      height: 8px;
      border: 1px solid #16a34a;
      border-radius: 1px;
      background: #ffffff;
      padding: 0.5px;
    }

    .veg-dot {
      display: block;
      width: 4.5px;
      height: 4.5px;
      border-radius: 50%;
      background: #16a34a;
    }

    /* Product Title */
    .product-title {
      font-size: 6.2pt;
      font-weight: 700;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 0.5mm;
    }

    /* Barcode Graphic & Human-Readable Text */
    .barcode-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0.4mm 0 0.2mm 0;
    }

    .barcode-graphic {
      width: 100%;
      display: flex;
      justify-content: center;
      overflow: hidden;
    }

    .barcode-graphic svg {
      width: 44mm;
      height: 7.5mm;
      display: block;
    }

    .barcode-text {
      font-family: "Courier New", Courier, monospace;
      font-size: 5.2pt;
      font-weight: 700;
      letter-spacing: 0.6px;
      line-height: 1;
      margin-top: 0.3mm;
    }

    /* Footer Metadata */
    .sticker-footer-row1 {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 5.2pt;
      line-height: 1.1;
    }

    .mrp-price {
      font-weight: 800;
      font-size: 5.6pt;
    }

    .dates {
      font-size: 4.6pt;
      color: #1f2937;
    }

    .sticker-footer-row2 {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 4.6pt;
      line-height: 1;
    }

    .branch-meta {
      font-size: 4.5pt;
      color: #374151;
      font-weight: 600;
    }

    .tagline {
      font-weight: 800;
      font-size: 4.8pt;
      letter-spacing: 0.2px;
    }

    /* Print Specific Media Styles */
    @media print {
      html, body {
        width: 50mm;
        margin: 0;
        padding: 0;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .roll-container {
        padding: 0;
        gap: 0;
      }

      .thermal-sticker {
        page-break-after: always;
        break-after: page;
        page-break-inside: avoid;
        break-inside: avoid;
        border: none;
        box-shadow: none;
      }
    }

    /* Screen Preview Styles */
    @media screen {
      body {
        padding: 24px;
      }

      .roll-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .thermal-sticker {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid #e5e7eb;
        border-radius: 2px;
      }
    }
  </style>
</head>
<body>
  <div class="roll-container">
    ${stickerHtmlList}
  </div>
  ${autoPrint ? '<script>window.onload = function() { window.print(); };</script>' : ''}
</body>
</html>`.trim();
}

// ============================================================================
// 5. VECTOR PDF GENERATOR (50mm × 25mm JSTHERMAL)
// ============================================================================

/**
 * Generates an ultra-crisp, pure vector PDF for 50mm × 25mm thermal stickers using jsPDF.
 * Renders Code128 barcode bars as exact vector rectangles without rasterization or canvas dependencies.
 * Returns a Uint8Array containing the raw PDF bytes (magic header `%PDF-`).
 */
export async function generateThermalStickerPdf(
  units: ThermalStickerData[]
): Promise<Uint8Array> {
  if (!units || units.length === 0) {
    throw new Error('Cannot generate PDF: units array is empty');
  }

  // Initialize jsPDF with custom thermal roll dimensions: 50mm x 25mm in landscape
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [50, 25],
    compress: true,
  });

  for (let index = 0; index < units.length; index++) {
    const unit = units[index];

    // For units after index 0, append a new 50mm x 25mm page
    if (index > 0) {
      doc.addPage([50, 25], 'landscape');
    }

    // ------------------------------------------------------------------------
    // 1. Top Header: "GOPAL CAKE SHOP" and Veg Badge
    // ------------------------------------------------------------------------
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.text('GOPAL CAKE SHOP', 24, 3.2, { align: 'center' });

    // Statutory FSSAI Green Vegetarian Emblem (if isVeg !== false)
    if (unit.isVeg !== false) {
      // Outer green square border at (x=44.2, y=1.2, w=3.0, h=3.0)
      doc.setDrawColor(22, 163, 74);
      doc.setLineWidth(0.25);
      doc.rect(44.2, 1.2, 3.0, 3.0, 'S');

      // Inner green solid circle at center (45.7, 2.7) with radius 0.9mm
      doc.setFillColor(22, 163, 74);
      doc.circle(45.7, 2.7, 0.9, 'F');
    }

    // ------------------------------------------------------------------------
    // 2. Product Name & Variant Weight
    // ------------------------------------------------------------------------
    const weightStr = unit.variantWeight ? ` (${unit.variantWeight})` : '';
    let productLine = `${unit.itemName}${weightStr}`;
    if (productLine.length > 29) {
      productLine = productLine.slice(0, 27) + '..';
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(0, 0, 0);
    doc.text(productLine, 25, 5.8, { align: 'center' });

    // ------------------------------------------------------------------------
    // 3. Code128 Vector Barcode Rectangles
    // ------------------------------------------------------------------------
    const binaryPattern = getCode128Pattern(unit.barcode);
    const barcodeWidth = 42.0; // 42mm allocated for barcode width
    const moduleWidth = barcodeWidth / binaryPattern.length;
    const barcodeStartX = (50.0 - barcodeWidth) / 2; // Center horizontally (4mm left margin)
    const barcodeTopY = 7.0;
    const barcodeHeight = 7.0;

    doc.setFillColor(0, 0, 0);

    let currentX = barcodeStartX;
    let bitIndex = 0;

    // Direct vector drawing of bar runs
    while (bitIndex < binaryPattern.length) {
      const bit = binaryPattern[bitIndex];
      let runLength = 1;
      while (
        bitIndex + runLength < binaryPattern.length &&
        binaryPattern[bitIndex + runLength] === bit
      ) {
        runLength++;
      }

      const runWidthMm = runLength * moduleWidth;
      if (bit === '1') {
        doc.rect(currentX, barcodeTopY, runWidthMm, barcodeHeight, 'F');
      }

      currentX += runWidthMm;
      bitIndex += runLength;
    }

    // ------------------------------------------------------------------------
    // 4. Centered Monospace Barcode Code
    // ------------------------------------------------------------------------
    doc.setFont('courier', 'bold');
    doc.setFontSize(5.2);
    doc.text(unit.barcode, 25, 16.0, { align: 'center' });

    // ------------------------------------------------------------------------
    // 5. Commercial Footer Row 1: MRP & Pkd/Exp Dates
    // ------------------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.6);
    doc.text(`MRP: Rs.${unit.price.toFixed(2)}`, 2.5, 19.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.6);
    doc.text(`Pkd:${unit.packedDate}  Exp:${unit.expiryDate}`, 47.5, 19.2, {
      align: 'right',
    });

    // ------------------------------------------------------------------------
    // 6. Commercial Footer Row 2: Branch/Batch & Eggless Tagline
    // ------------------------------------------------------------------------
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    const branchMeta = `${unit.branchCode || 'VAR'}${unit.batchNumber ? ' | B:' + unit.batchNumber : ''}`;
    doc.text(branchMeta, 2.5, 22.4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    const tagline = unit.tagline || '100% EGGLESS · VADODARA';
    doc.text(tagline, 47.5, 22.4, { align: 'right' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}
