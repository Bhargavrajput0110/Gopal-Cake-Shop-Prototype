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
  /** Legacy display names that map to this branch (used by the API) */
  aliases: string[];
}

export const BRANCHES: Branch[] = [
  {
    id: 'uma',
    displayName: 'Uma Branch (Main Outlet)',
    shortName: 'Uma',
    address: 'B-9, Sunil Society, Behind Zavernagar Bus Stand Ward, Uma Char Rasta, Vadodara, Gujarat 390019',
    aliases: ['Uma Char Rasta', 'Uma Branch', 'uma', 'B_UMA', 'UMA'],
  },
  {
    id: 'khanderao',
    displayName: 'Khanderao Branch',
    shortName: 'Khanderao',
    address: '76W2+WQ9, Palace Rd, Khanderao Market Char Rasta, Prabhat Nagar, Mandvi, Vadodara, Gujarat 390001',
    aliases: ['Khanderao Market', 'Khanderao Branch (HQ)', 'Khanderao Branch', 'B_KHM', 'cmswuiita00011su3977ajl1z', 'CMSWUIITA00011SU3977AJL1Z', '3977ajl1z'],
  },
  {
    id: 'varasiya',
    displayName: 'Varasiya Factory',
    shortName: 'Varasiya',
    address: 'Opp T-8, Behind Hari Seva School, Warashia Colony, Vadodara, Gujarat 390006',
    aliases: ['Varasiya Factory Outlet', 'Factory Warashiya', 'B_VAR', 'cmswuiiu000021su3kv1mr41f', 'cmswuiic00021su3kv1mr41f', 'CMSWUIIU000021SU3KV1MR41F', 'CMSWUIIC00021SU3KV1MR41F', 'kv1mr41f'],
  },
  {
    id: 'elora',
    displayName: 'Ellora Park Branch',
    shortName: 'Ellora Park',
    address: 'Shop No.1, Ellora Park Rd, Nr. Neo Mobile & Jalaram Lassi, Opp. Shakti Farsan, Odhavpura, Ellora Park, Hari Nagar, Vadodara, Gujarat 390023',
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
  if (lower.includes('varas') || lower.includes('waras') || lower.includes('kv1mr41f') || lower.includes('cmswuii')) return 'varasiya';
  if (lower.includes('khand') || lower.includes('3977ajl1z')) return 'khanderao';
  return 'varasiya';
}

/** Get display name for a branch ID */
export function toBranchDisplayName(id?: string | null): string {
  if (!id) return 'Varasiya Factory';
  const lower = id.toLowerCase().trim();
  if (lower.includes('varas') || lower.includes('waras') || lower.includes('kv1mr41f') || lower.includes('cmswuii')) return 'Varasiya Factory';
  if (lower.includes('khand') || lower.includes('3977ajl1z')) return 'Khanderao Branch';
  if (lower.includes('uma')) return 'Uma Branch (Main Outlet)';
  if (lower.includes('elor') || lower.includes('ellor') || lower.includes('vfrn9eq5')) return 'Ellora Park Branch';

  const canonical = toBranchId(id);
  const found = BRANCHES.find(b => b.id === canonical);
  if (found) return found.displayName;
  return 'Varasiya Factory';
}

/** Get short name for a branch ID */
export function toBranchShortName(id?: string | null): string {
  if (!id) return 'Varasiya';
  const lower = id.toLowerCase().trim();
  if (lower.includes('varas') || lower.includes('waras') || lower.includes('kv1mr41f') || lower.includes('cmswuii')) return 'Varasiya';
  if (lower.includes('khand') || lower.includes('3977ajl1z')) return 'Khanderao';
  if (lower.includes('uma')) return 'Uma';
  if (lower.includes('elor') || lower.includes('ellor') || lower.includes('vfrn9eq5')) return 'Ellora Park';

  const canonical = toBranchId(id);
  const found = BRANCHES.find(b => b.id === canonical);
  if (found) return found.shortName;
  return 'Varasiya';
}

/** Get numeric branch code (001: Uma, 002: Khanderao, 003: Warashiya, 004: Ellora Park) */
export function getBranchNumericCode(rawBranchId?: string | null): string {
  const canonical = toBranchId(rawBranchId);
  switch (canonical) {
    case 'uma': return '001';
    case 'khanderao': return '002';
    case 'varasiya': return '003';
    case 'elora': return '004';
    default: return '001';
  }
}

/** Generate 100% sequential order number starting from 0001 per branch (e.g. 001-0001, 003-0001) */
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
