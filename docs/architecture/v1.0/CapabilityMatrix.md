# Bakery OS: Capability Matrix

Instead of assigning monolithic roles (e.g., "Has Admin Access"), Bakery OS relies on a capability-driven RBAC (Role-Based Access Control) architecture. Roles are simply collections of these granular capabilities.

---

## 🔑 Capability Definitions

### Content & Media (CMS)
- `View Products`, `Create Products`, `Edit Products`, `Archive Products`, `Delete Products`
- `View Categories`, `Manage Categories`
- `View Media`, `Upload Media`, `Delete Media`
- `Manage Banners`
- `View Designs`, `Upload Designs`, `Tag Designs`, `Approve Designs`, `Delete Designs`

### Operations (Orders)
- `Create Manual Order`: Access the Storefront Engine via the internal portal.
- `Bypass Inventory`: Sell items even if marked out-of-stock.
- `Approve Order`: Move an order from NEW to WAITING_FOR_CHEF.
- `Cancel Order`: Void an active order.
- `Change Order Priority`: Mark an order as Urgent.

### Production (Kitchen)
- `Accept Order`: Claim an order ticket from the pool.
- `Update Production Status`: Move order through Making, Decorating, Ready states.
- `Complete QC`: Sign off on the Quality Control checklist.

### Delivery & Fulfillment
- `Self-Assign Delivery`: Driver accepts a pending delivery.
- `Reassign Driver`: Manager forces a delivery from Driver A to Driver B.
- `Update Delivery Status`: Mark orders as Picked Up, On The Way, Delivered, or Failed.

### Finance & Audit
- `Override Price`: Sell an item below its configured base price.
- `Waive Delivery Fee`: Zero out dynamic delivery calculations.
- `Issue Refund`: Process partial or full financial refunds.
- `View Audit Logs`: Access the immutable ledger of system actions.

### Configuration (Layer 2)
- `Edit Owner Settings`: Change business rules (GST, Delivery Radiuses, Business Hours).
- `Manage Staff`: Create or revoke user access and assign roles.

### Analytics (BI)
- `View Operational Dashboard`: Access live heartbeat metrics.
- `View Historical BI`: Access heavy analytical queries and margin reports.

---

## 👤 Role Mappings (Default Package)

| Role | Capabilities Granted |
| :--- | :--- |
| **Admin (Owner)** | `*` (All Capabilities) |
| **Manager** | `Create Manual Order`, `Approve Order`, `Cancel Order`, `Change Order Priority`, `Reassign Driver`, `Complete QC`, `Waive Delivery Fee`, `View Operational Dashboard`, `View Historical BI`, `Manage Designs` |
| **Sales** | `Create Manual Order`, `Manage Designs` |
| **Chef** | `Accept Order`, `Update Production Status`, `Complete QC` |
| **Driver** | `Self-Assign Delivery`, `Update Delivery Status` |
