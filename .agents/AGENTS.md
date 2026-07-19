# Bakery OS V1 – Flagship Product Quality Charter

**PRIMARY MISSION:** Build a system that allows Gopal Cake Shop to operate an entire business day using only Bakery OS.

**QUALITY STANDARD:** Before implementing any feature, ask yourself: 'Would a real bakery owner immediately feel this is better than their current process?' Build workflows, not CRUD pages.

**USER EXPERIENCE PRINCIPLES:** Speed (minimize clicks, fast search, keyboard shortcuts). Visual Quality (professional spacing, typography, colors, no incomplete UI). Reliability (fail gracefully, no orphan records, duplicate actions, or stale UI).

**BUSINESS-FIRST THINKING:** Optimize for real bakery operations during peak volume.

**SINGLE SOURCE OF TRUTH:** One Checkout Engine, One Timeline, One Notification Engine, One Permission System, One Cart Model.

**EVERY FEATURE MUST PROPAGATE:** Verify downstream impact (e.g. Product -> POS -> Checkout -> Receipt -> Chef -> Driver -> Reports).

**POLISH IS A REQUIREMENT:** Minor details matter.

**OPERATIONAL SIMULATION:** Mentally simulate a busy bakery day before freezing.

**REUSE BEFORE BUILD:** Always prefer improving existing architecture over creating new architecture.

**VENDOR WORKFLOW RULES:** There are exactly three global vendors shared by every branch: Florist, Photo Print, Acrylic Topper. Vendor Portal is strictly minimal.

**PREMIUM SOFTWARE MINDSET:** Fast, reliable, consistent, elegant, predictable, professional.

**EXECUTION RULE:** Implement -> Build -> TypeScript -> Lint -> Playwright -> Manual Verification -> Regression Testing -> Evidence Report -> Freeze -> Proceed. Never skip a step.


## UI Mode Protocol
- **UI MODE ONLY:** When the user requests to be in UI mode, focus strictly on frontend design, HTML/CSS, Tailwind styling, and React component layouts. 
- **Hands-off Backend:** Do not modify backend APIs, database schemas, Prisma models, or state management context unless explicitly requested.
- **IDE Collaboration:** The user will be making UI changes directly in their IDE. Do not overwrite their UI changes. Instead, treat their IDE changes as the source of truth for design.

## UI Mode Exit Protocol
- When the user explicitly requests to exit UI mode, switch to full stack mode, or needs backend work:
  1. The agent MUST run git status and git diff to review all the UI changes the user made in their IDE.
  2. The agent MUST generate a detailed log/summary artifact documenting what design changes were made.
  3. Only after logging the users IDE changes should the agent resume normal operations.
