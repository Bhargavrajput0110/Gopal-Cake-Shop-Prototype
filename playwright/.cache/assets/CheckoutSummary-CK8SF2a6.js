import { j as jsxRuntimeExports } from './jsx-runtime-C3Be6Oa3.js';
import './index-ChmT8FO5.js';

function CheckoutSummary({
  name,
  house,
  area,
  city,
  paymentMethod,
  subtotal
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mb-6", "data-testid": "checkout-summary", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-muted/20 rounded-xl border space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Deliver to:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: name || "-" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: [house, area, city].filter(Boolean).join(", ") || "-" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-muted/20 rounded-xl border space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Payment:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: paymentMethod })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center text-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-muted-foreground", children: "Total to Pay" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-black text-primary", children: [
        "₹",
        subtotal
      ] })
    ] }) })
  ] });
}

export { CheckoutSummary };
//# sourceMappingURL=CheckoutSummary-CK8SF2a6.js.map
