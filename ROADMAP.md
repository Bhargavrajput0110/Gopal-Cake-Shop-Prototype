# Bakery OS Product Roadmap

This document outlines the strategic phases and overarching roadmap for the Bakery OS ERP platform.

## Architecture Freeze Policy

> [!IMPORTANT]
> **Once implementation of a minor release begins, new functionality is deferred to the next planned version unless it fixes a critical defect, security issue, or architectural flaw. The roadmap for the active release is considered frozen until release completion.**

---

## ✅ Phase 1 — Core ERP (Completed)
- Authentication & RBAC
- POS
- Products
- Orders
- Delivery
- Kitchen (KDS)
- Dynamic Pricing
- Operational Dashboard
- Timeline
- Notifications
- Animation System
- PWA
- Branch Isolation

---

## 🟡 Phase 2 — Production Hardening (Active)
*Goal: Validate, harden, and observe the system before adding new features.*

### 1. Security
- Penetration testing & RBAC verification
- Session expiry & PIN brute-force protection
- Rate limiting & Upload validation

### 2. Performance & Stress Testing
- Test with 500+ orders, 10,000 products, 100 concurrent users.
- Large Cloudinary libraries.

### 3. PWA Robustness
- Offline queue & Background sync.
- Install flow, update flow, and cache invalidation.

### 4. Observability & Backups
- Error logging & Performance metrics.
- Audit monitoring & Slow query logging.
- PostgreSQL & Cloudinary backups.
- Rollback strategy.

### 5. Staging & Owner UAT
- Deploy to staging.
- Shadowing the owner during a full operational simulation.

---

## 🟢 Phase 3 — Dashboard & KPI Engine (Upcoming)
*Goal: Decouple reporting from live operational queries to protect performance.*

### 1. Reporting Architecture
- `ReportingService` -> Daily Aggregations -> KPI Engine -> Dashboard APIs.

### 2. Specialized Dashboards
- **Executive Dashboard:** Revenue, Orders, AOV, Conversion, Repeat Customers, Profit.
- **Branch Dashboard:** Branch Revenue, Pending Orders, Kitchen Load, Delivery Performance, Staff Productivity.
- **Kitchen Dashboard:** Average Prep Time, Delayed Orders, Orders Per Chef, Completion Rate.
- **Delivery Dashboard:** Average Delivery Time, Failed Deliveries, Driver Performance, Distance Covered.

---

## 🟣 Phase 4 — Business Modules
*Goal: Expand core business operations and communications.*

### 1. Unified Notification Center
- Generic abstract channel interface: `Notification -> Channel -> [WhatsApp, Email, SMS, Push, In-App]`.
- Outbox pattern for async delivery.

### 2. Comprehensive Manual Order Module
- Unified workflow for Walk-ins, Phone calls, WhatsApp, Instagram, Facebook.

### 3. Media Gallery
- Cloudinary integration for staff and products.

---

## 🟠 Phase 5 — Inventory & Procurement
*Goal: Complete the bakery lifecycle.*

- **Workflow:** Ingredient -> Purchase Request -> Vendor -> Purchase Order -> Goods Received -> Stock -> Production -> Waste -> Reorder.

---

## 🔵 Phase 6 — Intelligence Layer (Future)
*Goal: AI assists decisions, it doesn't replace business rules.*

- Dynamic pricing suggestions.
- Production forecasting.
- Ingredient demand prediction.
- Staff scheduling.
- Customer recommendations.
- Inventory forecasting.
