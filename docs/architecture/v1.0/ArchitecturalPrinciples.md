# Bakery OS: Architectural Principles

These 10 non-negotiable principles govern every technical and product decision for Bakery OS. Before any code is written, the proposed feature must be validated against these rules to ensure the platform remains coherent, scalable, and operationally superior.

---

### 1. Every feature must answer "Why?"
Never ask "Can we build this?" Ask "Does this reduce operational work or increase revenue?"
- ❌ *Fancy animations in the kitchen dashboard.*
- ✅ *One-click reorder of a customer's previous cake.*

### 2. Every feature belongs to exactly one domain
Modules must never overlap. Strict boundaries ensure true service isolation.
- **CMS owns:** Products, Categories, Banners, Design Library.
- **CRM owns:** Customers, Loyalty, Marketing, Conversation timeline.
- **Operations owns:** Orders, Kitchen, Drivers, QC.
- **BI owns:** Reports, Analytics, Forecasts.

### 3. Every object should have a lifecycle
Lifecycles must be granular. Every transition must feed the Timeline, Audit Log, Notifications, Analytics, and CRM without duplicating logic.
- *Created ➡️ Accepted ➡️ Recipe Allocated ➡️ Inventory Reserved ➡️ Making ➡️ Decorating ➡️ QC ➡️ Packed ➡️ Waiting Driver ➡️ Picked Up ➡️ Delivered ➡️ Closed ➡️ Archived.*

### 4. Every action should create business data
A single operational click must fan out (via the Outbox pattern) to enrich the entire business state.
- *Driver clicks "Delivered" ➡️ Produces Timeline entry, Audit log, Customer history update, Revenue update, Delivery analytics, Loyalty points, WhatsApp event, Notification, and BI metrics.*

### 5. Build an Event Catalog
Do not scatter events across codebase constants. Maintain a versioned Event Catalog that explicitly defines producers and consumers.
- `ORDER_CREATED` (Producer: Storefront ➡️ Consumers: Notifications, BI, CRM)
- `ORDER_READY` (Producer: Kitchen ➡️ Consumers: Driver, WhatsApp)

### 6. Every module should expose capabilities
Do not assign monolithic roles (e.g., "Has CMS Access"). Define granular capabilities that map to RBAC.
- *Capabilities: `Manage Products`, `Manage Categories`, `Manage Designs`, `Manage Banners`, `Manage SEO`, `Manage Media`.*

### 7. Introduce Feature Packages
Architect the platform to support feature gating without changing the core codebase, enabling multi-tenant monetization.
- **Starter:** Orders, POS, Products.
- **Professional:** Inventory, Drivers, Notifications.
- **Enterprise:** BOM, Production Planning, BI, CRM, AI.

### 8. Version configuration separately
Version code and configuration independently. Business owners must be able to roll back accidental configuration changes (e.g., GST changes, delivery radius tweaks) without rolling back the application deployment.

### 9. Think beyond bakeries
Design product catalogs, recipes, inventory, and workflows with enough flexibility to support adjacent verticals (Cafés, Sweet Shops, Chocolatiers, Ice Cream Parlors).

### 10. Automate decisions before automating clicks
Most software helps users click faster. Great operational software reduces the number of decisions users need to make.
- *Automatically assign the best chef instead of asking the manager.*
- *Suggest the least-loaded driver instead of making someone inspect the board.*
- *Recommend reorder quantities instead of asking the owner to calculate them.*

### 11. AI is a consumer, never an owner
AI should always suggest. A human or deterministic business rule must make the final operational decision unless autonomous behavior is explicitly enabled in a future version.
- **AI Can**: Recommend, predict, summarize, classify.
- **AI Cannot**: Create orders, issue refunds, delete products, modify inventory, change financial data.

---

## The Golden Rule of Completion

**"A phase is complete only when a business can use it every day without workarounds."**

This rule is stronger than "the code is finished." It ensures each layer of Bakery OS becomes genuinely useful before the next one is added, keeping the platform focused as it grows.
