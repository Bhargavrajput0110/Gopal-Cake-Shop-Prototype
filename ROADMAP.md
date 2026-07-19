# Product Roadmap

## Architecture Freeze Policy

> [!IMPORTANT]
> **Once implementation of a minor release begins, new functionality is deferred to the next planned version unless it fixes a critical defect, security issue, or architectural flaw. The roadmap for the active release is considered frozen until release completion.**

From this point until v1.1.0 is released:
- No new features
- No schema redesigns
- No roadmap expansion
- No "while we're here..." additions

Only the following are allowed:
- Bug fixes
- Critical design corrections
- Security fixes

---

## v1.1.0 - Dashboards & KPI Engine

The primary goal of v1.1.0 is to implement comprehensive business intelligence capabilities, giving executives and branch managers deep visibility into daily performance.

### Phase 1: Dashboards & KPI Engine (Active Implementation)

#### 1. ReportingService
- KPI aggregation
- Date range calculations
- Branch filtering

#### 2. Dashboard API
- `/api/v1/reporting/dashboard`
- Input validation
- Authorization
- API Tests

#### 3. Executive Dashboard UI
- KPI cards
- Charts
- Loading states
- Error handling

#### 4. Branch Dashboard
- Reuse Executive components
- Branch-specific filtering

#### 5. Dashboard Tests
- Unit tests
- Integration tests
- E2E tests

---

## v1.2.0 - Core Business Features & Communications

### 1. Internal Staff Notification System
- Notification Center, Live Updates, Role-based Targeting.

### 2. WhatsApp Integration (Meta Cloud API)
- Asynchronous queue-based delivery system, templates.

### 3. Comprehensive Manual Order Module
- Sales Manual Order and Admin Manual Order interfaces.

### 4. Cloudinary Integration
- Media management gallery for admin and staff.

---

## v1.3.0 - Advanced Marketing & Expansion

### 1. Marketing & CRM
- Customer Loyalty and Rewards programs.
- WhatsApp Marketing campaigns integrated directly into the ERP CRM.
- Email marketing support.

### 2. Expansion Features
- Franchise support structures.
- Mobile driver app enhancements (GPS tracking, native push notifications).
