// ============================================================
// GOPAL CAKE SHOP — MASTER FLAVOUR CATALOGUE
// Source of truth for all flavour dropdowns across the system
// ============================================================

export type FlavourCategory = "regular" | "summer_exclusive" | "winter_exclusive";

export interface Flavour {
  id: string;
  name: string;
  category: FlavourCategory;
  isActive: boolean; // Seasonal flavours toggled by Admin
}

// ---- REGULAR FLAVOURS (Always Available) ----
export const REGULAR_FLAVOURS: Flavour[] = [
  { id: "mix-berries", name: "Mix Berries", category: "regular", isActive: true },
  { id: "rose-pistachio", name: "Rose Pistachio", category: "regular", isActive: true },
  { id: "white-truffle-kessar-badam", name: "White Truffle Kessar Badam", category: "regular", isActive: true },
  { id: "kessar-badam", name: "Kessar Badam", category: "regular", isActive: true },
  { id: "white-truffle-biscoff", name: "White Truffle Biscoff", category: "regular", isActive: true },
  { id: "biscoff-nutella", name: "Biscoff Nutella", category: "regular", isActive: true },
  { id: "biscoff", name: "Biscoff", category: "regular", isActive: true },
  { id: "kunafa-dark-chocolate", name: "Kunafa Dark Chocolate", category: "regular", isActive: true },
  { id: "kunafa-milk-chocolate", name: "Kunafa Milk Chocolate", category: "regular", isActive: true },
  { id: "kunafa-white-chocolate", name: "Kunafa White Chocolate", category: "regular", isActive: true },
  { id: "redvelvet-rock", name: "Red Velvet Rock", category: "regular", isActive: true },
  { id: "redvelvet-white-truffle", name: "Red Velvet White Truffle", category: "regular", isActive: true },
  { id: "pineapple", name: "Pineapple", category: "regular", isActive: true },
  { id: "strawberry", name: "Strawberry", category: "regular", isActive: true },
  { id: "strawberry-forest", name: "Strawberry Forest", category: "regular", isActive: true },
  { id: "mango", name: "Mango", category: "regular", isActive: true },
  { id: "orange-truffle", name: "Orange Truffle", category: "regular", isActive: true },
  { id: "white-forest", name: "White Forest", category: "regular", isActive: true },
  { id: "strawberry-truffle", name: "Strawberry Truffle", category: "regular", isActive: true },
  { id: "mango-truffle", name: "Mango Truffle", category: "regular", isActive: true },
  { id: "black-current", name: "Black Current", category: "regular", isActive: true },
  { id: "classic-black-forest", name: "Classic Black Forest", category: "regular", isActive: true },
  { id: "raspberry", name: "Raspberry", category: "regular", isActive: true },
  { id: "mixfruit", name: "Mix Fruit", category: "regular", isActive: true },
  { id: "blueberry", name: "Blueberry", category: "regular", isActive: true },
  { id: "blueberry-truffle", name: "Blueberry Truffle", category: "regular", isActive: true },
  { id: "german-blackforest", name: "German Black Forest", category: "regular", isActive: true },
  { id: "kiwi-strawberry", name: "Kiwi Strawberry", category: "regular", isActive: true },
  { id: "hide-and-seek", name: "Hide and Seek", category: "regular", isActive: true },
  { id: "swiss-truffle", name: "Swiss Truffle", category: "regular", isActive: true },
  { id: "swiss-rock", name: "Swiss Rock", category: "regular", isActive: true },
  { id: "choco-gooey", name: "Choco Gooey", category: "regular", isActive: true },
  { id: "choco-forest", name: "Choco Forest", category: "regular", isActive: true },
  { id: "choco-basket", name: "Choco Basket", category: "regular", isActive: true },
  { id: "choco-temptation", name: "Choco Temptation", category: "regular", isActive: true },
  { id: "death-by-chocolate", name: "Death by Chocolate", category: "regular", isActive: true },
  { id: "twin-chocolate", name: "Twin Chocolate", category: "regular", isActive: true },
  { id: "gooey-brownie", name: "Gooey Brownie", category: "regular", isActive: true },
  { id: "brownie-madness", name: "Brownie Madness", category: "regular", isActive: true },
  { id: "choco-pyramid", name: "Choco Pyramid", category: "regular", isActive: true },
  { id: "black-forest", name: "Black Forest", category: "regular", isActive: true },
  { id: "choco-delight", name: "Choco Delight", category: "regular", isActive: true },
  { id: "choco-chips", name: "Choco Chips", category: "regular", isActive: true },
  { id: "choco-flakes", name: "Choco Flakes", category: "regular", isActive: true },
  { id: "choco-vanilla", name: "Choco Vanilla", category: "regular", isActive: true },
  { id: "choco-fantasy", name: "Choco Fantasy", category: "regular", isActive: true },
  { id: "coffee-delight", name: "Coffee Delight", category: "regular", isActive: true },
  { id: "tiramisu", name: "Tiramisu", category: "regular", isActive: true },
  { id: "caramel-truffle", name: "Caramel Truffle", category: "regular", isActive: true },
  { id: "choco-mousse", name: "Choco Mousse", category: "regular", isActive: true },
  { id: "choco-oreo", name: "Choco Oreo", category: "regular", isActive: true },
  { id: "dark-mousse", name: "Dark Mousse", category: "regular", isActive: true },
  { id: "choco-duet-mousse", name: "Choco Duet Mousse", category: "regular", isActive: true },
  { id: "belgian-chocolate", name: "Belgian Chocolate", category: "regular", isActive: true },
  { id: "chocolate-surprise", name: "Chocolate Surprise", category: "regular", isActive: true },
  { id: "chocolate-crackle", name: "Chocolate Crackle", category: "regular", isActive: true },
  { id: "choco-holic", name: "Choco Holic", category: "regular", isActive: true },
  { id: "italian-cappuccino", name: "Italian Cappuccino", category: "regular", isActive: true },
  { id: "rich-chocolate", name: "Rich Chocolate", category: "regular", isActive: true },
  { id: "dark-bottom", name: "Dark Bottom", category: "regular", isActive: true },
  { id: "choco-mocha", name: "Choco Mocha", category: "regular", isActive: true },
  { id: "oreo-blossom", name: "Oreo Blossom", category: "regular", isActive: true },
  { id: "butterscotch", name: "Butterscotch", category: "regular", isActive: true },
  { id: "choco-nut", name: "Choco Nut", category: "regular", isActive: true },
  { id: "choco-crunchy", name: "Choco Crunchy", category: "regular", isActive: true },
  { id: "brazilian-surprise", name: "Brazilian Surprise", category: "regular", isActive: true },
  { id: "brownie-crunchy", name: "Brownie Crunchy", category: "regular", isActive: true },
  { id: "choco-almond", name: "Choco Almond", category: "regular", isActive: true },
  { id: "chocolate-ferrero-rocher", name: "Chocolate Ferrero Rocher", category: "regular", isActive: true },
  { id: "brownie-hazelnut", name: "Brownie Hazelnut", category: "regular", isActive: true },
  { id: "hazelnut-crunch", name: "Hazelnut Crunch", category: "regular", isActive: true },
  { id: "chocolate-walnut", name: "Chocolate Walnut", category: "regular", isActive: true },
  { id: "almond-butterscotch", name: "Almond Butterscotch", category: "regular", isActive: true },
  { id: "redvelvet", name: "Red Velvet", category: "regular", isActive: true },
  { id: "rainbow", name: "Rainbow", category: "regular", isActive: true },
  { id: "rasmalai", name: "Rasmalai", category: "regular", isActive: true },
  { id: "gulab-jamun", name: "Gulab Jamun", category: "regular", isActive: true },
  { id: "kaju-katri", name: "Kaju Katri", category: "regular", isActive: true },
  { id: "nutella-truffle", name: "Nutella Truffle", category: "regular", isActive: true },
  { id: "pure-nutella", name: "Pure Nutella", category: "regular", isActive: true },
];

// ---- SUMMER EXCLUSIVE — MANGO FUSION (Admin Toggle) ----
export const MANGO_FUSION_FLAVOURS: Flavour[] = [
  { id: "mango-pistachio", name: "Mango Pistachio", category: "summer_exclusive", isActive: false },
  { id: "mango-kessar-badam", name: "Mango Kessar Badam", category: "summer_exclusive", isActive: false },
  { id: "mango-faluda", name: "Mango Faluda", category: "summer_exclusive", isActive: false },
  { id: "mango-lychee", name: "Mango Lychee", category: "summer_exclusive", isActive: false },
  { id: "mango-biscoff", name: "Mango Biscoff", category: "summer_exclusive", isActive: false },
  { id: "mango-nutella", name: "Mango Nutella", category: "summer_exclusive", isActive: false },
  { id: "mango-german-chocolate", name: "Mango German Chocolate", category: "summer_exclusive", isActive: false },
  { id: "mango-truffle", name: "Mango Truffle", category: "summer_exclusive", isActive: false },
  { id: "mango-almond-butterscotch", name: "Mango Almond Butterscotch", category: "summer_exclusive", isActive: false },
  { id: "mango-white-truffle", name: "Mango White Truffle", category: "summer_exclusive", isActive: false },
  { id: "mango-italian-cappuccino", name: "Mango Italian Cappuccino", category: "summer_exclusive", isActive: false },
  { id: "mango-mocha-truffle", name: "Mango Mocha Truffle", category: "summer_exclusive", isActive: false },
  { id: "mango-tiramisu", name: "Mango Tiramisu", category: "summer_exclusive", isActive: false },
  { id: "mango-coconut", name: "Mango Coconut", category: "summer_exclusive", isActive: false },
  { id: "mango-mousse", name: "Mango Mousse", category: "summer_exclusive", isActive: false },
  { id: "mango-cassata", name: "Mango Cassata", category: "summer_exclusive", isActive: false },
  { id: "mango-rose-pistachio", name: "Mango Rose Pistachio", category: "summer_exclusive", isActive: false },
  { id: "mango-white-mocha", name: "Mango White Mocha", category: "summer_exclusive", isActive: false },
  { id: "mango-ferrero", name: "Mango Ferrero", category: "summer_exclusive", isActive: false },
  { id: "mango-rasmalai", name: "Mango Rasmalai", category: "summer_exclusive", isActive: false },
  { id: "mango-gulab-jamun", name: "Mango Gulab Jamun", category: "summer_exclusive", isActive: false },
  { id: "mango-kaju-katri", name: "Mango Kaju Katri", category: "summer_exclusive", isActive: false },
  { id: "mango-rasgulla", name: "Mango Rasgulla", category: "summer_exclusive", isActive: false },
  { id: "mango-blueberry", name: "Mango Blueberry", category: "summer_exclusive", isActive: false },
];

// ---- WINTER EXCLUSIVE — STRAWBERRY FUSION (Admin Toggle) ----
export const STRAWBERRY_FUSION_FLAVOURS: Flavour[] = [
  { id: "strawberry-pistachio", name: "Strawberry Pistachio", category: "winter_exclusive", isActive: false },
  { id: "strawberry-kessar-badam", name: "Strawberry Kessar Badam", category: "winter_exclusive", isActive: false },
  { id: "strawberry-faluda", name: "Strawberry Faluda", category: "winter_exclusive", isActive: false },
  { id: "strawberry-lychee", name: "Strawberry Lychee", category: "winter_exclusive", isActive: false },
  { id: "strawberry-biscoff", name: "Strawberry Biscoff", category: "winter_exclusive", isActive: false },
  { id: "strawberry-nutella", name: "Strawberry Nutella", category: "winter_exclusive", isActive: false },
  { id: "strawberry-german-chocolate", name: "Strawberry German Chocolate", category: "winter_exclusive", isActive: false },
  { id: "strawberry-truffle-fusion", name: "Strawberry Truffle", category: "winter_exclusive", isActive: false },
  { id: "strawberry-almond-butterscotch", name: "Strawberry Almond Butterscotch", category: "winter_exclusive", isActive: false },
  { id: "strawberry-white-truffle", name: "Strawberry White Truffle", category: "winter_exclusive", isActive: false },
  { id: "strawberry-italian-cappuccino", name: "Strawberry Italian Cappuccino", category: "winter_exclusive", isActive: false },
  { id: "strawberry-mocha-truffle", name: "Strawberry Mocha Truffle", category: "winter_exclusive", isActive: false },
  { id: "strawberry-tiramisu", name: "Strawberry Tiramisu", category: "winter_exclusive", isActive: false },
  { id: "strawberry-coconut", name: "Strawberry Coconut", category: "winter_exclusive", isActive: false },
  { id: "strawberry-mousse", name: "Strawberry Mousse", category: "winter_exclusive", isActive: false },
  { id: "strawberry-cassata", name: "Strawberry Cassata", category: "winter_exclusive", isActive: false },
  { id: "strawberry-rose-pistachio", name: "Strawberry Rose Pistachio", category: "winter_exclusive", isActive: false },
  { id: "strawberry-white-mocha", name: "Strawberry White Mocha", category: "winter_exclusive", isActive: false },
  { id: "strawberry-ferrero", name: "Strawberry Ferrero", category: "winter_exclusive", isActive: false },
  { id: "strawberry-rasmalai", name: "Strawberry Rasmalai", category: "winter_exclusive", isActive: false },
  { id: "strawberry-gulab-jamun", name: "Strawberry Gulab Jamun", category: "winter_exclusive", isActive: false },
  { id: "strawberry-kaju-katri", name: "Strawberry Kaju Katri", category: "winter_exclusive", isActive: false },
  { id: "strawberry-rasgulla", name: "Strawberry Rasgulla", category: "winter_exclusive", isActive: false },
  { id: "strawberry-blueberry", name: "Strawberry Blueberry", category: "winter_exclusive", isActive: false },
];

// Master list — all flavours combined
export const ALL_FLAVOURS: Flavour[] = [
  ...REGULAR_FLAVOURS,
  ...MANGO_FUSION_FLAVOURS,
  ...STRAWBERRY_FUSION_FLAVOURS,
];

// Helper: Get only active flavours (for storefront display)
export function getActiveFlavours(): Flavour[] {
  return ALL_FLAVOURS.filter((f) => f.isActive);
}

// ---- WEIGHT OPTIONS ----
// Full range: 250g increments up to 1kg, then 500g increments up to 10kg
// Prices are set by Admin via dashboard — these values are placeholders only
export const WEIGHT_OPTIONS = [
  { label: "250g",  value: "250g"  },
  { label: "500g",  value: "500g"  },
  { label: "750g",  value: "750g"  },
  { label: "1 Kg",  value: "1kg"   },
  { label: "1.5 Kg", value: "1.5kg" },
  { label: "2 Kg",  value: "2kg"   },
  { label: "2.5 Kg", value: "2.5kg" },
  { label: "3 Kg",  value: "3kg"   },
  { label: "3.5 Kg", value: "3.5kg" },
  { label: "4 Kg",  value: "4kg"   },
  { label: "4.5 Kg", value: "4.5kg" },
  { label: "5 Kg",  value: "5kg"   },
  { label: "5.5 Kg", value: "5.5kg" },
  { label: "6 Kg",  value: "6kg"   },
  { label: "6.5 Kg", value: "6.5kg" },
  { label: "7 Kg",  value: "7kg"   },
  { label: "7.5 Kg", value: "7.5kg" },
  { label: "8 Kg",  value: "8kg"   },
  { label: "8.5 Kg", value: "8.5kg" },
  { label: "9 Kg",  value: "9kg"   },
  { label: "9.5 Kg", value: "9.5kg" },
  { label: "10 Kg", value: "10kg"  },
];
