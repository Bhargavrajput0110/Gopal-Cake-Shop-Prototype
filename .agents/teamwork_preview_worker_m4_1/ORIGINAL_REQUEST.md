## 2026-07-05T11:02:56Z
You are teamwork_preview_worker for Milestone 4: Admin Analytics & Moderation UI.
Your working directory is d:\Gopal Cake Shop\.agents\teamwork_preview_worker_m4_1.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your tasks:
1. Update `src/app/admin/page.tsx` (the main /admin path dashboard) to render at least 3 distinct chart types (Line, Bar, Donut) with real order data:
   - Line Chart (or Area Chart) showing Revenue Trends: daily/weekly/monthly based on date range selected.
   - Bar Chart showing Top-selling Cake Flavours: extract the `flavour` or parse flavor keywords (Chocolate, Red Velvet, Vanilla, Pineapple, Butterscotch, Strawberry, Mango, Blueberry) from order items and display their totals.
   - Donut/Pie Chart showing Orders by Branch: slice orders by `branch` name.
   - Conversion Funnel: show the pipeline volume transition (Total Placed -> Accepted by Chef -> Completed/Delivered) using a custom chart or visual component.
   - Ensure all charts are responsive and styled nicely to fit the premium theme.
2. Create `/admin/reviews/page.tsx`:
   - Build a review moderation table interface.
   - Fetch all reviews from database via a helper or direct Supabase client call (query table `Review`, join with `User` for customer name, and `products` for product name, or fetch them and format).
   - Display Review Details: Star rating (1-5 stars UI), Comment, Product Name, Customer Name, and Date.
   - Display a status badge: "Approved" (green) or "Pending Moderation" (amber).
   - Add action buttons "Approve" and "Hide" for each review. Clicking them calls `PATCH /api/reviews/moderate` with `{ reviewId, approved: true/false }` and updates the state.
3. Update `src/components/admin/AdminSidebar.tsx`:
   - Import `Star` or `MessageSquare` from `lucide-react`.
   - Add `{ name: "Reviews", href: "/admin/reviews", icon: Star }` to the `navItems` array so it is visible in the sidebar navigation.
4. Verify compilation and build using `npm run build`.
5. Write your handoff report to `d:\Gopal Cake Shop\.agents\teamwork_preview_worker_m4_1\handoff.md`.
