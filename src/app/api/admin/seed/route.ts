import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const branches = [
  { id: 'khanderao', name: 'Khanderao Market', address: 'Khanderao Market, Vadodara', contactNumber: '' },
  { id: 'uma', name: 'Uma', address: 'Uma, Vadodara', contactNumber: '' },
  { id: 'varasiya', name: 'Varasiya', address: 'Varasiya, Vadodara', contactNumber: '' },
  { id: 'elora', name: 'Elora', address: 'Elora, Vadodara', contactNumber: '' },
];

const users = [
  { id: 'usr_admin', name: 'Admin', role: 'admin', branchId: null, pin: '0000' },
  { id: 'usr_manager_khm', name: 'Manager KHM', role: 'manager', branchId: 'khanderao', pin: '1111' },
  { id: 'usr_sales_khm', name: 'Sales KHM', role: 'sales', branchId: 'khanderao', pin: '2222' },
  { id: 'usr_chef_khm', name: 'Chef KHM', role: 'chef', branchId: 'khanderao', pin: '3333' },
  { id: 'usr_driver_khm', name: 'Driver KHM', role: 'driver', branchId: 'khanderao', pin: '4444' },
  { id: 'usr_sales_uma', name: 'Sales Uma', role: 'sales', branchId: 'uma', pin: '5555' },
  { id: 'usr_chef_uma', name: 'Chef Uma', role: 'chef', branchId: 'uma', pin: '6666' },
  { id: 'usr_vendor_photo', name: 'Vendor Photo', role: 'VENDOR_PHOTO', branchId: null, pin: '7777' },
  { id: 'usr_vendor_florist', name: 'Vendor Florist', role: 'VENDOR_FLORIST', branchId: null, pin: '8888' },
  { id: 'usr_vendor_acrylic', name: 'Vendor Acrylic', role: 'VENDOR_ACRYLIC', branchId: null, pin: '9999' },
];

const categories = [
  { categoryId: 'butter-cream', name: 'Butter Cream Cake', displayOrder: 1 },
  { categoryId: 'fresh-cream', name: 'Fresh Cream Cake', displayOrder: 2 },
  { categoryId: 'fondant', name: 'Fondant Cake', displayOrder: 3 },
  { categoryId: 'photo-cake', name: 'Photo Cake', displayOrder: 4 },
  { categoryId: 'photo-cream', name: 'Photo Cream Cake', displayOrder: 5 },
  { categoryId: 'pull-me-up', name: 'Pull Me Up Cake', displayOrder: 6 },
  { categoryId: 'bomb-cake', name: 'Bomb Cake', displayOrder: 7 },
  { categoryId: 'tier-cake', name: 'Tier Cake', displayOrder: 8 },
  { categoryId: 'pinata', name: 'Pinata Cake', displayOrder: 9 },
  { categoryId: 'designer', name: 'Designer Cake', displayOrder: 10 },
  { categoryId: 'wedding', name: 'Wedding Cake', displayOrder: 11 },
  { categoryId: 'anniversary', name: 'Anniversary Cake', displayOrder: 12 },
  { categoryId: 'birthday', name: 'Birthday Cake', displayOrder: 13 },
  { categoryId: 'kids', name: 'Kids Special Cake', displayOrder: 14 },
  { categoryId: 'cartoon', name: 'Cartoon Cake', displayOrder: 15 },
  { categoryId: 'heart-shape', name: 'Heart Shape Cake', displayOrder: 16 },
  { categoryId: 'number-shape', name: 'Number Shape Cake', displayOrder: 17 },
  { categoryId: 'letter-shape', name: 'Letter Shape Cake', displayOrder: 18 },
  { categoryId: 'book-shape', name: 'Book Shape Cake', displayOrder: 19 },
  { categoryId: 'car-shape', name: 'Car Shape Cake', displayOrder: 20 },
  { categoryId: 'guitar-shape', name: 'Guitar Shape Cake', displayOrder: 21 },
  { categoryId: 'handbag-shape', name: 'Handbag Shape Cake', displayOrder: 22 },
  { categoryId: 'helmet-shape', name: 'Helmet Shape Cake', displayOrder: 23 },
  { categoryId: 'trophy-shape', name: 'Trophy Shape Cake', displayOrder: 24 },
  { categoryId: 'chocolate', name: 'Chocolate Cake', displayOrder: 25 },
  { categoryId: 'truffle', name: 'Truffle Cake', displayOrder: 26 },
  { categoryId: 'red-velvet', name: 'Red Velvet Cake', displayOrder: 27 },
  { categoryId: 'black-forest', name: 'Black Forest Cake', displayOrder: 28 },
  { categoryId: 'white-forest', name: 'White Forest Cake', displayOrder: 29 },
  { categoryId: 'pineapple', name: 'Pineapple Cake', displayOrder: 30 },
  { categoryId: 'mango', name: 'Mango Cake', displayOrder: 31 },
  { categoryId: 'strawberry', name: 'Strawberry Cake', displayOrder: 32 },
  { categoryId: 'blueberry', name: 'Blueberry Cake', displayOrder: 33 },
  { categoryId: 'butterscotch', name: 'Butterscotch Cake', displayOrder: 34 },
  { categoryId: 'vanilla', name: 'Vanilla Cake', displayOrder: 35 },
  { categoryId: 'lemon', name: 'Lemon Cake', displayOrder: 36 },
  { categoryId: 'coffee', name: 'Coffee Cake', displayOrder: 37 },
  { categoryId: 'caramel', name: 'Caramel Cake', displayOrder: 38 },
  { categoryId: 'eggless', name: 'Eggless Cake', displayOrder: 39 },
  { categoryId: 'sugar-free', name: 'Sugar Free Cake', displayOrder: 40 },
  { categoryId: 'vegan', name: 'Vegan Cake', displayOrder: 41 },
  { categoryId: 'gluten-free', name: 'Gluten Free Cake', displayOrder: 42 },
  { categoryId: 'jar-cake', name: 'Jar Cake', displayOrder: 43 },
  { categoryId: 'cup-cake', name: 'Cup Cake', displayOrder: 44 },
  { categoryId: 'mini-cake', name: 'Mini Cake', displayOrder: 45 },
  { categoryId: 'pastry', name: 'Pastry', displayOrder: 46 },
  { categoryId: 'brownie', name: 'Brownie', displayOrder: 47 },
  { categoryId: 'cheesecake', name: 'Cheesecake', displayOrder: 48 },
  { categoryId: 'mousse', name: 'Mousse Cake', displayOrder: 49 },
  { categoryId: 'swiss-roll', name: 'Swiss Roll', displayOrder: 50 },
  { categoryId: 'donut-cake', name: 'Donut Cake', displayOrder: 51 },
  { categoryId: 'naked-cake', name: 'Naked Cake', displayOrder: 52 },
  { categoryId: 'drip-cake', name: 'Drip Cake', displayOrder: 53 },
  { categoryId: 'mirror-glaze', name: 'Mirror Glaze Cake', displayOrder: 54 },
  { categoryId: 'geode', name: 'Geode Cake', displayOrder: 55 },
  { categoryId: 'galaxy', name: 'Galaxy Cake', displayOrder: 56 },
  { categoryId: 'ombre', name: 'Ombre Cake', displayOrder: 57 },
  { categoryId: 'watercolor', name: 'Watercolor Cake', displayOrder: 58 },
  { categoryId: 'floral', name: 'Floral Cake', displayOrder: 59 },
  { categoryId: 'unicorn', name: 'Unicorn Cake', displayOrder: 60 },
  { categoryId: 'frozen', name: 'Frozen Theme Cake', displayOrder: 61 },
  { categoryId: 'superhero', name: 'Superhero Cake', displayOrder: 62 },
];

const settings = [
  {
    companyName: 'Gopal Cake Shop',
    advancePaymentPercentage: 100,
    imageRetentionDays: 30,
    deliveryRadius: 10,
    pushNotificationEnabled: true,
    whatsappEnabled: false,
    maintenanceMode: false,
  },
];

export async function POST() {
  try {
    const results: Record<string, string> = {};

    // 1. Seed Branches
    const { error: branchError } = await supabaseAdmin
      .from('branches')
      .upsert(branches, { onConflict: 'id' });
    results.branches = branchError ? `Error: ${branchError.message}` : `${branches.length} inserted`;

    // 2. Seed Users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert(users, { onConflict: 'id' });
    results.users = userError ? `Error: ${userError.message}` : `${users.length} inserted`;

    // 3. Seed Categories
    const { error: catError } = await supabaseAdmin
      .from('categories')
      .upsert(categories, { onConflict: 'categoryId' });
    results.categories = catError ? `Error: ${catError.message}` : `${categories.length} inserted`;

    // 4. Seed Settings
    const { error: settingsError } = await supabaseAdmin
      .from('settings')
      .upsert(settings);
    results.settings = settingsError ? `Error: ${settingsError.message}` : '1 inserted';

    // 5. Seed Products
    const productsList = [
      {
        productId: 'prod-classic-chocolate',
        name: 'Classic Chocolate Cake',
        slug: 'classic-chocolate-cake',
        price: 450,
        categoryId: 'birthday',
        images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587'],
        status: 'active'
      },
      {
        productId: 'prod-red-velvet',
        name: 'Premium Red Velvet Cake',
        slug: 'premium-red-velvet-cake',
        price: 650,
        categoryId: 'anniversary',
        images: ['https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b'],
        status: 'active'
      },
      {
        productId: 'prod-royal-wedding',
        name: 'Royal 3-Tier Wedding Cake',
        slug: 'royal-3-tier-wedding-cake',
        price: 3500,
        categoryId: 'wedding',
        images: ['https://images.unsplash.com/photo-1535141192574-5d4897c13636'],
        status: 'active'
      },
      {
        productId: 'prod-rainbow-kids',
        name: 'Rainbow Fantasy Kids Cake',
        slug: 'rainbow-fantasy-kids-cake',
        price: 800,
        categoryId: 'kids',
        images: ['https://images.unsplash.com/photo-1557925923-cd4648e21187'],
        status: 'active'
      },
      {
        productId: 'prod-designer-fondant',
        name: 'Custom Designer Fondant Cake',
        slug: 'custom-designer-fondant-cake',
        price: 1500,
        categoryId: 'designer',
        images: ['https://images.unsplash.com/photo-1535254973040-607b474cb50d'],
        status: 'active'
      },
      {
        productId: 'prod-fresh-cream-pineapple',
        name: 'Fresh Cream Pineapple Cake',
        slug: 'fresh-cream-pineapple-cake',
        price: 400,
        categoryId: 'fresh-cream',
        images: ['https://images.unsplash.com/photo-1565958011703-44f9829ba187'],
        status: 'active'
      },
      {
        productId: 'prod-butter-cream-vanilla',
        name: 'Rich Butter Cream Vanilla Cake',
        slug: 'rich-butter-cream-vanilla-cake',
        price: 420,
        categoryId: 'butter-cream',
        images: ['https://images.unsplash.com/photo-1464349095431-e9a21285b5f3'],
        status: 'active'
      },
      {
        productId: 'prod-black-forest',
        name: 'Traditional Black Forest Cake',
        slug: 'traditional-black-forest-cake',
        price: 480,
        categoryId: 'birthday',
        images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c'],
        status: 'active'
      }
    ];

    let productsError = null;
    const { error: initialProductsError } = await supabaseAdmin
      .from('products')
      .upsert(productsList, { onConflict: 'productId' });

    if (initialProductsError) {
      if (initialProductsError.message.includes('slug') || initialProductsError.message.includes('schema cache')) {
        // Fallback: Remove slug field and try again
        const fallbackList = productsList.map(({ slug, ...rest }) => rest);
        const { error: fallbackProductsError } = await supabaseAdmin
          .from('products')
          .upsert(fallbackList, { onConflict: 'productId' });
        productsError = fallbackProductsError;
      } else {
        productsError = initialProductsError;
      }
    }

    results.products = productsError ? `Error: ${productsError.message}` : `${productsList.length} inserted`;

    // Invalidate all caches on seed run
    const globalRef = globalThis as typeof globalThis & {
      productsCache?: unknown;
      categoriesCache?: unknown;
      cachedOrderCount?: unknown;
    };
    globalRef.productsCache = null;
    globalRef.categoriesCache = null;
    globalRef.cachedOrderCount = null;

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
