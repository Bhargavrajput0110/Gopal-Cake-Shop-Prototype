# RBAC Capability Matrix

**Version:** 1.0
**Last Updated:** 2026-07-09

This matrix defines the specific administrative capabilities granted to roles within the Gopal Cake Shop ERP.

**Scope Key:**
- `G` = Global Scope (Across all branches)
- `B` = Branch Scope (Restricted to user's assigned branch)
- `❌` = Denied

| Capability / Permission | Admin | Manager | Sales | Chef | Delivery |
|-------------------------|-------|---------|-------|------|----------|
| `manage_users`          | G     | ❌      | ❌    | ❌   | ❌       |
| `manage_roles`          | G     | ❌      | ❌    | ❌   | ❌       |
| `manage_branches`       | G     | ❌      | ❌    | ❌   | ❌       |
| `manage_settings`       | G     | ❌      | ❌    | ❌   | ❌       |
| `manage_reports`        | G     | B       | ❌    | ❌   | ❌       |
| `manage_products`       | G     | G       | ❌    | ❌   | ❌       |
| `manage_categories`     | G     | G       | ❌    | ❌   | ❌       |
| `manage_coupons`        | G     | B       | ❌    | ❌   | ❌       |
| `manage_inventory`      | G     | B       | ❌    | B    | ❌       |
| `manage_customers`      | G     | B       | B     | ❌   | ❌       |
| `manage_notifications`  | G     | B       | B     | B    | B        |
| `view_orders`           | G     | B       | B     | B    | B        |
| `update_order_full`     | G     | B       | ❌    | ❌   | ❌       |
| `update_order_chef`     | G     | B       | ❌    | B    | ❌       |
| `update_order_driver`   | G     | B       | ❌    | ❌   | B        |

*Note: For multi-tenant or SaaS architectures, a `SUPER_ADMIN` role will be introduced strictly for platform ownership, bypassing branch restrictions entirely.*
