# Bakery OS: Event Catalog

This catalog defines the unified events emitted by the Outbox pattern. Every business action produces an event from this catalog, which is then asynchronously consumed by downstream modules (Notifications, CRM, BI, WhatsApp) to guarantee data consistency and loose coupling.

---

## 🏢 Business Events

Business events represent operational realities and often trigger customer notifications or financial updates.

| Event Name | Version | Producer | Consumers | Payload (Key Fields) | Idempotency Key | Trigger Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ORDER_CREATED` | v1 | Storefront Engine | Notifications, CRM, BI | `orderId, customerId, branchId, source, grandTotal` | `orderId` | Customer/POS checkout. |
| `ORDER_APPROVED` | v1 | Operations (Sales) | KDS, Notifications | `orderId, approvedBy` | `orderId_status` | Sales verifies order. |
| `CHEF_ACCEPTED` | v1 | Kitchen KDS | WhatsApp, Timeline | `orderId, chefId` | `orderId_status` | Chef begins prep. |
| `MAKING_STARTED`| v1 | Kitchen KDS | Timeline | `orderId, chefId` | `orderId_status` | Baking/assembly begins. |
| `DECORATING_STARTED`| v1 | Kitchen KDS | Timeline | `orderId, chefId` | `orderId_status` | Decorating/finishing stage. |
| `QC_PASSED` | v1 | Kitchen KDS | Timeline, Audit Log | `orderId, qcItems, checkedBy` | `orderId_qc` | Pre-dispatch QC passed. |
| `ORDER_READY` | v1 | Kitchen KDS | Driver App, WhatsApp | `orderId` | `orderId_status` | Order waiting for pickup. |
| `ORDER_CANCELLED`| v1 | Operations | CRM, BI, Inventory | `orderId, reasonCode` | `orderId_status` | Order voided, stock released. |
| `ORDER_COMPLETED`| v1 | Operations | CRM (Loyalty), BI | `orderId` | `orderId_status` | Customer picks up in-store. |
| `DRIVER_ASSIGNED`| v1 | Driver App / Manager| WhatsApp, KDS | `orderId, driverId` | `orderId_driverId`| Driver assigned. |
| `ORDER_DELIVERED`| v1 | Driver App | CRM, BI, Timeline | `orderId, deliveryNotes` | `orderId_status` | Order handed over. |
| `PAYMENT_COMPLETED`|v1 | Finance Engine | Accounting, Timeline | `orderId, transactionId, amt` | `transactionId` | Payment captured. |
| `REFUND_ISSUED` | v1 | Finance Engine | Accounting, WhatsApp, BI| `orderId, refundId, amt` | `refundId` | Refund processed. |

---

## ⚙️ System & Configuration Events

System events handle internal infrastructure, configurations, and audits. They do not trigger customer notifications.

| Event Name | Version | Producer | Consumers | Payload (Key Fields) | Idempotency Key | Trigger Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GST_CHANGED` | v1 | Configuration | Finance, Storefront, Audit | `oldRate, newRate, updatedBy` | `updateId` | Tax config updated. |
| `DELIVERY_RULE_CHANGED`| v1 | Configuration | Storefront, Audit | `ruleId, newLogic` | `updateId` | Delivery math updated. |
| `WHATSAPP_TEMPLATE_UPDATED`| v1 | Configuration | Notification Engine, Audit | `templateId, newBody`| `updateId` | Message template changed. |
| `MEDIA_UPLOADED` | v1 | Media Engine | Audit, CMS | `assetId, bucket, url` | `assetId` | File uploaded to bucket. |
| `CACHE_CLEARED` | v1 | System | Audit | `cacheKey, triggeredBy` | `triggerId` | Manual/system cache flush. |


| Event Name | Producer | Consumers |
| :--- | :--- | :--- |
| `INVENTORY_LOW` | Inventory Engine | Purchasing, Notifications (Manager) |
| `PRODUCT_SOLD_OUT` | CMS | Storefront, KDS |
| `NEW_REVIEW_RECEIVED`| CRM | Marketing, Notifications (Manager) |
