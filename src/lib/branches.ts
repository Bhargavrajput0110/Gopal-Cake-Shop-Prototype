/**
 * Single source of truth for all branch IDs and display names.
 * 
 * - `branchId` is the canonical DB value stored in Supabase orders.branch
 * - `displayName` is the human-readable label shown in the UI
 * - The API normalises any incoming display name → branchId automatically
 */

export type BranchId = 'khanderao' | 'elora' | 'uma' | 'varasiya';

export interface Branch {
  id: BranchId;
  displayName: string;
  shortName: string;
  address: string;
  phone: string;
  /** Legacy display names that map to this branch (used by the API) */
  aliases: string[];
}

export const BRANCHES: Branch[] = [
  {
    id: 'uma',
    displayName: 'Uma Branch (Main Outlet)',
    shortName: 'Uma',
    address: 'B-9, Sunil Society, Behind Zavernagar Bus Stand Ward, Uma Char Rasta, Vadodara, Gujarat 390019',
    phone: '+91 97126 32132',
    aliases: ['Uma Char Rasta', 'Uma Branch', 'uma', 'B_UMA', 'UMA'],
  },
  {
    id: 'khanderao',
    displayName: 'Khanderao Branch',
    shortName: 'Khanderao',
    address: '76W2+WQ9, Palace Rd, Khanderao Market Char Rasta, Prabhat Nagar, Mandvi, Vadodara, Gujarat 390001',
    phone: '+91 92659 76305',
    aliases: ['Khanderao Market', 'Khanderao Branch (HQ)', 'Khanderao Branch', 'B_KHM', 'cmswuiita00011su3977ajl1z', 'CMSWUIITA00011SU3977AJL1Z', '3977ajl1z'],
  },
  {
    id: 'varasiya',
    displayName: 'Warashiya Factory',
    shortName: 'Warashiya',
    address: 'Opp T-8, Behind Hari Seva School, Warashia Colony, Vadodara, Gujarat 390006',
    phone: '+91 96622 19666',
    aliases: ['Varasiya Factory Outlet', 'Varasiya Factory', 'Factory Warashiya', 'Factory Varasiya', 'B_VAR', 'cmswuiiu000021su3kv1mr41f', 'cmswuiic00021su3kv1mr41f', 'CMSWUIIU000021SU3KV1MR41F', 'CMSWUIIC00021SU3KV1MR41F', 'kv1mr41f'],
  },
  {
    id: 'elora',
    displayName: 'Ellora Park Branch',
    shortName: 'Ellora Park',
    address: 'Shop No.1, Ellora Park Rd, Nr. Neo Mobile & Jalaram Lassi, Opp. Shakti Farsan, Odhavpura, Ellora Park, Hari Nagar, Vadodara, Gujarat 390023',
    phone: '+91 94091 57804',
    aliases: ['Elora Park Branch', 'Ellora Park', 'Ellora Park Branch', 'B_ELL', 'cmswuiiun00031su3vfrn9eq5', 'CMSWUIIUN00031SU3VFRN9EQ5', 'vfrn9eq5'],
  },
];

/** Full map of any alias/id → canonical BranchId */
export const BRANCH_ALIAS_MAP: Record<string, BranchId> = (() => {
  const map: Record<string, BranchId> = {};
  for (const b of BRANCHES) {
    map[b.id] = b.id;
    map[b.displayName] = b.id;
    map[b.displayName.toLowerCase()] = b.id;
    for (const alias of b.aliases) {
      map[alias] = b.id;
      map[alias.toLowerCase()] = b.id;
    }
  }
  return map;
})();

/** Resolve any display name or alias to its canonical BranchId */
export function toBranchId(raw?: string | null): BranchId {
  if (!raw || typeof raw !== 'string' || raw.trim() === '' || raw === 'b-001' || raw === 'default-branch' || raw === 'mock-branch-1') {
    return 'khanderao';
  }
  const clean = raw.trim();
  if (BRANCH_ALIAS_MAP[clean]) {
    return BRANCH_ALIAS_MAP[clean];
  }
  const lower = clean.toLowerCase();
  if (BRANCH_ALIAS_MAP[lower]) {
    return BRANCH_ALIAS_MAP[lower];
  }
  if (lower.includes('uma')) return 'uma';
  if (lower.includes('elor') || lower.includes('ellor') || lower.includes('vfrn9eq5')) return 'elora';
  if (lower.includes('varas') || lower.includes('waras') || lower.includes('kv1mr41f')) return 'varasiya';
  if (lower.includes('khand') || lower.includes('3977ajl1z')) return 'khanderao';
  return 'varasiya';
}

/** Get display name for a branch ID */
export function toBranchDisplayName(id?: string | null): string {
  if (!id) return 'Warashiya Factory';
  const lower = id.toLowerCase().trim();
  if (lower.includes('varas') || lower.includes('waras') || lower.includes('kv1mr41f')) return 'Warashiya Factory';
  if (lower.includes('khand') || lower.includes('3977ajl1z')) return 'Khanderao Branch';
  if (lower.includes('uma')) return 'Uma Branch (Main Outlet)';
  if (lower.includes('elor') || lower.includes('ellor') || lower.includes('vfrn9eq5')) return 'Ellora Park Branch';

  const canonical = toBranchId(id);
  const found = BRANCHES.find(b => b.id === canonical);
  if (found) return found.displayName;
  return 'Warashiya Factory';
}

/** Get short name for a branch ID */
export function toBranchShortName(id?: string | null): string {
  if (!id) return 'Warashiya';
  const lower = id.toLowerCase().trim();
  if (lower.includes('varas') || lower.includes('waras') || lower.includes('kv1mr41f')) return 'Warashiya';
  if (lower.includes('khand') || lower.includes('3977ajl1z')) return 'Khanderao';
  if (lower.includes('uma')) return 'Uma';
  if (lower.includes('elor') || lower.includes('ellor') || lower.includes('vfrn9eq5')) return 'Ellora Park';

  const canonical = toBranchId(id);
  const found = BRANCHES.find(b => b.id === canonical);
  if (found) return found.shortName;
  return 'Warashiya';
}

/** Get the phone number for a branch */
export function getBranchPhone(rawBranchId?: string | null): string {
  const canonical = toBranchId(rawBranchId);
  const found = BRANCHES.find(b => b.id === canonical);
  return found?.phone ?? '+91 97126 32132';
}

/** Get branch prefix code for order numbers (UMA: Uma, KHM: Khanderao, WAR: Varasiya, ELR: Ellora Park) */
export function getBranchNumericCode(rawBranchId?: string | null): string {
  const canonical = toBranchId(rawBranchId);
  switch (canonical) {
    case 'uma':       return 'UMA';
    case 'khanderao': return 'KHM';
    case 'varasiya':  return 'WAR';
    case 'elora':     return 'ELR';
    default:          return 'UMA';
  }
}

/** Generate 100% sequential order number starting from 0001 per branch (e.g. UMA-0001, KHM-0001) */
export async function generateSequentialOrderNumber(tx: any, rawBranchId?: string | null): Promise<string> {
  const code = getBranchNumericCode(rawBranchId);
  const count = await tx.order.count({
    where: {
      orderNumber: { startsWith: `${code}-` }
    }
  });
  const nextSeq = (count + 1).toString().padStart(4, '0');
  return `${code}-${nextSeq}`;
}

/** Generate clean human-readable order number starting with branch numeric code (fallback format) */
export function generateFormattedOrderNumber(rawBranchId?: string | null): string {
  const code = getBranchNumericCode(rawBranchId);
  const timePart = Date.now().toString().slice(-4);
  const randPart = Math.floor(10 + Math.random() * 90).toString();
  return `${code}-${timePart}${randPart}`;
}
