const fs = require('fs');
const data = JSON.parse(fs.readFileSync('audit_results.json', 'utf8'));

let plan = `
# Staff Data Audit & Correction Plan

## User Review Required

> [!WARNING]
> Please review the audit results below. Several staff members have the wrong role or are assigned to incorrect internal Branch UUIDs.
> There are also numerous "Unexpected" legacy/test accounts in the database.
>
> **Do you approve the corrections (updating roles, fixing branch IDs) and keeping the historical/unexpected accounts as they are (or should they be deactivated)?**

## Audit Results

${data.markdown}

## Proposed Changes

Based on the rules:
1. **Role Corrections**:
   - Akshay will be changed from \`CHEF\` to \`HELPER_CHEF\`
   - Rajpal will be changed from \`CHEF\` to \`HELPER_CHEF\`
   - Pavan bhai will be changed from \`SALESPERSON\` to \`ALL_ROUNDER\`

2. **Branch ID Corrections**:
   Currently, several branches have auto-generated UUIDs instead of the canonical slugs (e.g. \`cmswuiiu000021su3kv1mr41f\` instead of \`warashiya\`, \`cmswuiita00011su3977ajl1z\` instead of \`market\`).
   - We will update these staff members' \`branchId\` to map to the correct canonical branch IDs that match the active operations.

3. **Unexpected / Legacy Users**:
   - There are 22 "UNEXPECTED" users, including old managers, vendors, and \`KHD\` (Khanderao) staff.
   - Per your rules, we **WILL NOT** delete them. They will remain untouched to preserve historical data.

4. **Delivery Scope Updates**:
   - We will implement explicit delivery scope fields or permissions for Pavan Bhai, Haru Bhai, Manoj, Pari Bhai, Baggi, and Pritesh without hardcoding names.

## Verification Plan
1. We will apply the mutations using Prisma without doing a reset.
2. We will run a post-audit script to ensure \`Total authoritative staff = 32\`, with 0 mismatches.
3. We will verify Delivery Authorization rules via script checks.
`;

fs.writeFileSync('C:/Users/Bhargav/.gemini/antigravity-ide/brain/1dc10ae7-f636-4933-9db4-de6d015ba28e/implementation_plan.md', plan);
