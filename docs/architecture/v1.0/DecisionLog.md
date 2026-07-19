# Architecture Decision Log (ADR)

This log records intentional strategic deferrals and architectural decisions for Bakery OS.

---

## ADR-001: Postponement of Artificial Intelligence (AI) Features

- **Decision**: All AI functionality (demand prediction, purchase suggestions, automated chef/driver assignment, NLP design search) is formally postponed to v2.x.
- **Reason**: AI models require vast amounts of structured, clean operational data to be effective. Currently, Bakery OS does not have historical production metrics or seasonal baselines. Implementing AI now would result in brittle, hardcoded heuristics rather than true machine learning.
- **Review Date**: After 6 months of continuous production usage, at which point the BI module (v1.7) will be evaluated to determine if sufficient data exists to train the models.

---

## ADR-002: Strict Data Domain Separation for Media

- **Decision**: Media assets will not be stored in a single flat structure. They must be isolated into strictly defined buckets (`CATALOG`, `DESIGN_LIBRARY`, `CUSTOMER_REFERENCE`, `PHOTO_CAKE`).
- **Reason**: Customer privacy (photo cakes) and intellectual property (design library) require vastly different access control and retention policies. A flat structure introduces unacceptable security and operational risks.
- **Review Date**: Permanent.
