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
    aliases: ['Uma Char Rasta', 'Uma Branch', 'uma', 'B_UMA'],
  },
  {
    id: 'khanderao',
    displayName: 'Khanderao Branch',
    shortName: 'Khanderao',
    address: '76W2+WQ9, Palace Rd, Khanderao Market Char Rasta, Prabhat Nagar, Mandvi, Vadodara, Gujarat 390001',
    aliases: ['Khanderao Market', 'Khanderao Branch (HQ)', 'Khanderao Branch', 'B_KHM', 'cmswuiita00011su3977ajl1z'],
  },
  {
    id: 'varasiya',
    displayName: 'Factory Warashiya',
    shortName: 'Varasiya',
    address: 'Opp T-8, Behind Hari Seva School, Warashia Colony, Vadodara, Gujarat 390006',
    aliases: ['Varasiya Factory Outlet', 'Factory Warashiya', 'B_VAR', 'cmswuiiu000021su3kv1mr41f'],
  },
  {
    id: 'elora',
    displayName: 'Ellora Park Branch',
    shortName: 'Ellora Park',
    address: 'Shop No.1, Ellora Park Rd, Nr. Neo Mobile & Jalaram Lassi, Opp. Shakti Farsan, Odhavpura, Ellora Park, Hari Nagar, Vadodara, Gujarat 390023',
    aliases: ['Elora Park Branch', 'Ellora Park', 'Ellora Park Branch', 'B_ELL', 'cmswuiiun00031su3vfrn9eq5'],
  },
];

/** Full map of any alias/id → canonical BranchId */
export const BRANCH_ALIAS_MAP: Record<string, BranchId> = (() => {
  const map: Record<string, BranchId> = {};
  for (const b of BRANCHES) {
    map[b.id] = b.id;
    map[b.displayName] = b.id;
    for (const alias of b.aliases) {
      map[alias] = b.id;
    }
  }
  return map;
})();

/** Resolve any display name or alias to its canonical BranchId */
export function toBranchId(raw?: string | null): BranchId {
  if (!raw || typeof raw !== 'string' || raw.trim() === '' || raw === 'b-001' || raw === 'default-branch' || raw === 'mock-branch-1') {
    return 'khanderao';
  }
  if (BRANCH_ALIAS_MAP[raw]) {
    return BRANCH_ALIAS_MAP[raw];
  }
  const lower = raw.toLowerCase().trim();
  if (BRANCH_ALIAS_MAP[lower]) {
    return BRANCH_ALIAS_MAP[lower];
  }
  if (lower.includes('uma')) return 'uma';
  if (lower.includes('elor') || lower.includes('ellor')) return 'elora';
  if (lower.includes('varas') || lower.includes('waras')) return 'varasiya';
  if (lower.includes('khand')) return 'khanderao';
  return 'khanderao';
}

/** Get display name for a branch ID */
export function toBranchDisplayName(id: string): string {
  return BRANCHES.find(b => b.id === id)?.displayName ?? id;
}

/** Get short name for a branch ID */
export function toBranchShortName(id: string): string {
  const canonical = toBranchId(id);
  return BRANCHES.find(b => b.id === canonical)?.shortName ?? id;
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

/** Generate clean human-readable order number starting with branch numeric code (e.g. 001-789412) */
export function generateFormattedOrderNumber(rawBranchId?: string | null): string {
  const code = getBranchNumericCode(rawBranchId);
  const timePart = Date.now().toString().slice(-4);
  const randPart = Math.floor(10 + Math.random() * 90).toString();
  return `${code}-${timePart}${randPart}`;
}
