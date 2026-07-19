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
  /** Legacy display names that map to this branch (used by the API) */
  aliases: string[];
}

export const BRANCHES: Branch[] = [
  {
    id: 'khanderao',
    displayName: 'Khanderao Branch',
    shortName: 'Khanderao',
    aliases: ['Khanderao Market', 'Khanderao Branch (HQ)', 'Khanderao Branch'],
  },
  {
    id: 'elora',
    displayName: 'Ellora Park Branch',
    shortName: 'Ellora Park',
    aliases: ['Elora Park Branch', 'Ellora Park', 'Ellora Park Branch'],
  },
  {
    id: 'uma',
    displayName: 'Uma Branch',
    shortName: 'Uma',
    aliases: ['Uma Char Rasta', 'Uma Branch'],
  },
  {
    id: 'varasiya',
    displayName: 'Factory Warashiya',
    shortName: 'Varasiya',
    aliases: ['Varasiya Factory Outlet', 'Factory Warashiya'],
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
export function toBranchId(raw: string): BranchId {
  return BRANCH_ALIAS_MAP[raw] ?? (raw as BranchId);
}

/** Get display name for a branch ID */
export function toBranchDisplayName(id: string): string {
  return BRANCHES.find(b => b.id === id)?.displayName ?? id;
}

/** Get short name for a branch ID */
export function toBranchShortName(id: string): string {
  return BRANCHES.find(b => b.id === id)?.shortName ?? id;
}
