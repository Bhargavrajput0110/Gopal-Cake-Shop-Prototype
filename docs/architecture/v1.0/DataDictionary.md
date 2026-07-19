# Bakery OS: Canonical Data Dictionary

This document establishes the single source of truth for the core entities in Bakery OS. Every module, API, and database table must conform to these definitions to prevent domain overlap.

---

## 🗄️ Data Separation Strategy

To ensure long-term performance, data is conceptually split into two categories:
1. **Operational Data (Hot)**: High-frequency read/writes. Needed to run the bakery right now. (Orders, Active Drivers, Kitchen Queue, Current Inventory, Configuration).
2. **Historical Data (Cold/Warm)**: Immutable logs and archives used for reports and audits. (Audit Logs, Timeline, BI Analytics, Archived Orders, Past Settlements).

---

## 📦 Core Entities

### `Order`
- **Owner**: Operations Domain
- **Read By**: CRM, BI, Notifications, Driver App, Kitchen KDS, Storefront
- **Description**: The commercial transaction and fulfillment contract between the bakery and the customer.
- **Core Fields**: `id`, `status`, `customer`, `branch`, `source`, `paymentDetails`, `items`, `pricing`, `deliveryTarget`.

### `Timeline`
- **Owner**: Core Platform (Foundation Layer 1)
- **Read By**: Operations, Customer Portal, Admin Audits
- **Description**: The immutable, historical ledger of lifecycle events for an `Order`.
- **Core Fields**: `id`, `orderId`, `action`, `previousState`, `nextState`, `actorId`, `actorRole`, `note`.

### `AuditLog`
- **Owner**: Core Platform (Foundation Layer 1)
- **Read By**: Admin, BI
- **Description**: Strict financial and configuration audit trailing (Historical).
- **Core Fields**: `id`, `action`, `actorId`, `entity`, `oldValue`, `newValue`, `reasonCode`.

### `User` (Staff)
- **Owner**: Identity Domain
- **Read By**: Operations, HR, Audit
- **Description**: Operational employees of the bakery.
- **Core Fields**: `id`, `name`, `role`, `capabilities`, `branchId`.

### `Customer`
- **Owner**: CRM Domain
- **Read By**: Operations, Storefront, Notifications, BI
- **Description**: The end consumer. Stores lifelong history, preferences, and loyalty data.
- **Core Fields**: `id`, `phone`, `name`, `email`, `totalSpent`, `lifetimeOrders`, `anniversary`, `birthday`, `preferences`.

### `Product`
- **Owner**: CMS Domain
- **Read By**: Storefront, Operations, Inventory, BI
- **Description**: The sellable items listed on the storefront or POS.
- **Core Fields**: `id`, `name`, `slug`, `categoryId`, `basePrice`, `isAvailable`, `seoMetadata`, `mediaUrls`.

### `MediaAsset`
- **Owner**: Media Engine (Layer 1)
- **Read By**: CMS, CRM, Operations
- **Description**: Images stored in Cloudinary/S3, partitioned strictly by permission and retention.
- **Buckets**: `CATALOG`, `DESIGN_LIBRARY`, `CUSTOMER_REFERENCE`, `PHOTO_CAKE`, `PRODUCTION`, `QC`, `MARKETING`, `BANNERS`, `DOCUMENTS`, `STAFF`, `SYSTEM`.

---

## 💳 Finance Domain

### `Payment`
- **Owner**: Finance Domain
- **Read By**: Operations, BI, CRM
- **Description**: Captured funds (Cash, UPI, Razorpay) linked to an Order.
- **Core Fields**: `id`, `orderId`, `amount`, `method`, `providerId`, `status`.

### `Refund`
- **Owner**: Finance Domain
- **Read By**: Operations, BI
- **Description**: Reversals of captured payments.
- **Core Fields**: `id`, `paymentId`, `amount`, `reason`, `processedBy`, `status`.

### `Settlement`
- **Owner**: Finance Domain
- **Read By**: BI, Admin
- **Description**: End-of-day reconciliation records matching logical sales to physical/bank cash.
- **Core Fields**: `id`, `branchId`, `date`, `expectedCash`, `actualCash`, `expectedUpi`, `actualUpi`, `variance`.

---

## ⚙️ Configuration Domain (Layer 2)

Configuration is split into logical blocks rather than a monolithic JSON blob.

### `BusinessSettings`
- **Core Fields**: `tenantId`, `workingDays`, `businessHours`, `cancellationPolicy`.
### `TaxSettings`
- **Core Fields**: `tenantId`, `gstRate`, `hsnCodes`.
### `DeliverySettings`
- **Core Fields**: `tenantId`, `deliveryRadiuses`, `baseCharge`, `perKmCharge`, `slots`.
### `NotificationSettings`
- **Core Fields**: `tenantId`, `whatsappTemplates`, `emailTemplates`, `smsFallbacks`.
