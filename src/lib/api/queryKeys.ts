export const queryKeys = {
  products: ["products"],
  product: (id: string) => ["products", id],

  customers: ["customers"],
  customer: (id: string) => ["customers", id],

  orders: ["orders"],
  order: (id: string) => ["orders", id],

  branches: ["branches"],
  branch: (id: string) => ["branches", id],

  coupons: ["coupons"],
  coupon: (id: string) => ["coupons", id],

  categories: ["categories"],
  category: (id: string) => ["categories", id],

  settings: ["settings"],
};
