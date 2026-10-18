/**
 * itemUtils.ts — Centralized helpers for item categorization and weight formatting.
 *
 * Prevents non-cake items (Bouquets, Hot Bakes, Savouries, Merchandise)
 * from receiving default weights (like 1kg) or displaying weight on receipts,
 * bills, WhatsApp notifications, Chef KDS, or invoices.
 */

export interface ItemLike {
  id?: string;
  productId?: string | null;
  name?: string | null;
  productName?: string | null;
  designName?: string | null;
  categoryId?: string | null;
  category?: {
    id?: string;
    slug?: string;
    name?: string;
  } | null;
  variant?: string | null;
  weight?: number | string | null;
  flavor?: string | null;
  flavour?: string | null;
  sku?: string | null;
  requiredVendors?: string[] | null;
  parentItemId?: string | null;
}

/**
 * Returns true if an item is a fresh floral arrangement, bouquet, or florist product (NOT a cake).
 * Note: Cakes like "Bouquet Cake" or "Flower Cake" are cakes, so we explicitly check they don't contain 'cake'.
 */
export function isFlowerOrBouquetItem(item: ItemLike | null | undefined): boolean {
  if (!item) return false;

  // Category IDs known for Bouquets
  if (item.categoryId === 'cmv9h4efd0000a0u3u8yom3qt') return true;

  const catSlug = (item.category?.slug || '').toLowerCase();
  const catName = (item.category?.name || '').toLowerCase();
  const name = (item.productName || item.name || item.designName || '').toLowerCase();
  const variant = (item.variant || '').toLowerCase();
  const sku = (item.sku || '').toUpperCase();
  const reqVendors = Array.isArray(item.requiredVendors) ? item.requiredVendors : [];

  // Child vendor items for florist
  if (name.includes('florist component')) return true;

  // If the word "cake" is in the product name or category name (e.g. "Bouquet Cake", "Flower Cake"), it's a CAKE
  const isCakeName = name.includes('cake') || catName.includes('cake') || catSlug.includes('cake');
  if (isCakeName) return false;

  if (sku.startsWith('BQT-')) return true;
  if (catSlug === 'bouquets' || catSlug === 'flowers') return true;
  if (catName.includes('bouquet') || catName.includes('floral')) return true;
  if (variant.includes('bouquet') || variant.includes('arrangement')) return true;

  if (name.includes('bouquet')) return true;
  if (name.includes('carnation') || name.includes('lily') || name.includes('lilies') || name.includes('orchid')) return true;
  if ((name.includes('flower') || name.includes('rose')) && reqVendors.includes('VENDOR_FLORIST')) return true;

  return false;
}

/**
 * Returns true if an item is a hot bake, savoury, or piece item (puffs, rolls, etc.).
 */
export function isHotBakeOrSavouriesItem(item: ItemLike | null | undefined): boolean {
  if (!item) return false;

  if (item.categoryId === 'cmuts899k0000ygu3pigymkyy') return true;

  const catSlug = (item.category?.slug || '').toLowerCase();
  const catName = (item.category?.name || '').toLowerCase();
  const name = (item.productName || item.name || item.designName || '').toLowerCase();
  const variant = (item.variant || '').toLowerCase();

  if (catSlug === 'hot-bakes' || catSlug === 'savouries' || catSlug === 'puff') return true;
  if (catName.includes('hot bake') || catName.includes('savouries') || catName.includes('puff')) return true;
  if (name.includes('puff') || name.includes('bake') || name.includes('samosa') || name.includes('patty')) return true;
  if (variant === 'piece') return true;

  return false;
}

/**
 * Returns true if an item should NOT have a weight (Bouquet, Hot Bake, Accessory, Candle, Topper, etc.).
 */
export function isPieceOrNonWeightItem(item: ItemLike | null | undefined): boolean {
  if (!item) return false;

  if (isFlowerOrBouquetItem(item)) return true;
  if (isHotBakeOrSavouriesItem(item)) return true;

  const name = (item.productName || item.name || item.designName || '').toLowerCase();
  const variant = (item.variant || '').toLowerCase();
  const catName = (item.category?.name || '').toLowerCase();

  if (variant === 'piece' || variant === 'unit' || variant.includes('bouquet')) return true;
  if (catName.includes('accessory') || catName.includes('accessories') || catName.includes('merchandise') || catName.includes('candle') || catName.includes('topper')) return true;
  if (name.includes('candle') || name.includes('sparkler') || name.includes('topper') || name.includes('knife') || name.includes('cap') || name.includes('popper')) return true;

  // If weight is explicitly 0 or empty and it's not a cake
  const w = Number(item.weight);
  if (!isNaN(w) && w === 0 && !name.includes('cake')) return true;

  return false;
}

/**
 * Formats the item weight for display (e.g. "500g", "1kg", "1.5kg").
 * Returns empty string or undefined if the item is a non-weight item or weight is <= 0.
 */
export function formatItemWeight(item: ItemLike | null | undefined): string | undefined {
  if (!item || isPieceOrNonWeightItem(item)) return undefined;

  const w = Number(item.weight);
  if (isNaN(w) || w <= 0) return undefined;

  return w < 1 ? `${Math.round(w * 1000)}g` : `${w}kg`;
}
