import 'dotenv/config'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

const branches = [
  { id: 'khanderao', name: 'Khanderao Market', code: 'KHD', address: 'Khanderao Market, Vadodara', phone: '9876543210' },
  { id: 'uma', name: 'Uma', code: 'UMA', address: 'Uma, Vadodara', phone: '9876543211' },
  { id: 'varasiya', name: 'Varasiya', code: 'VAR', address: 'Varasiya, Vadodara', phone: '9876543212' },
  { id: 'elora', name: 'Elora', code: 'ELL', address: 'Elora, Vadodara', phone: '9876543213' },
]

const users = [
  { id: 'usr_admin', name: 'Admin', role: Role.ADMIN, branchId: null, pin: '0000' },
  { id: 'usr_manager_khm', name: 'Manager KHM', role: Role.MANAGER, branchId: 'khanderao', pin: '1111' },
  { id: 'usr_sales_khm', name: 'Sales KHM', role: Role.SALESPERSON, branchId: 'khanderao', pin: '2222' },
  { id: 'usr_chef_khm', name: 'Chef KHM', role: Role.CHEF, branchId: 'khanderao', pin: '3333' },
  { id: 'usr_driver_khm', name: 'Driver KHM', role: Role.DELIVERY, branchId: 'khanderao', pin: '4444' },
  { id: 'usr_sales_uma', name: 'Sales Uma', role: Role.SALESPERSON, branchId: 'uma', pin: '5555' },
  { id: 'usr_chef_uma', name: 'Chef Uma', role: Role.CHEF, branchId: 'uma', pin: '6666' },
  { id: 'usr_vendor_photo', name: 'Vendor Photo', role: Role.VENDOR_PHOTO, branchId: null, pin: '7777' },
  { id: 'usr_vendor_florist', name: 'Vendor Florist', role: Role.VENDOR_FLORIST, branchId: null, pin: '8888' },
  { id: 'usr_vendor_acrylic', name: 'Vendor Acrylic', role: Role.VENDOR_ACRYLIC, branchId: null, pin: '9999' },
]

const categories = [
  { slug: 'butter-cream', name: 'Butter Cream Cake' },
  { slug: 'fresh-cream', name: 'Fresh Cream Cake' },
  { slug: 'fondant', name: 'Fondant Cake' },
  { slug: 'photo-cake', name: 'Photo Cake' },
  { slug: 'photo-cream', name: 'Photo Cream Cake' },
  { slug: 'pull-me-up', name: 'Pull Me Up Cake' },
  { slug: 'bomb-cake', name: 'Bomb Cake' },
  { slug: 'tier-cake', name: 'Tier Cake' },
  { slug: 'pinata', name: 'Pinata Cake' },
  { slug: 'designer', name: 'Designer Cake' },
  { slug: 'wedding', name: 'Wedding Cake' },
  { slug: 'anniversary', name: 'Anniversary Cake' },
  { slug: 'birthday', name: 'Birthday Cake' },
  { slug: 'kids', name: 'Kids Special Cake' },
  { slug: 'cartoon', name: 'Cartoon Cake' },
  { slug: 'heart-shape', name: 'Heart Shape Cake' },
  { slug: 'number-shape', name: 'Number Shape Cake' },
  { slug: 'letter-shape', name: 'Letter Shape Cake' },
  { slug: 'book-shape', name: 'Book Shape Cake' },
  { slug: 'car-shape', name: 'Car Shape Cake' },
  { slug: 'guitar-shape', name: 'Guitar Shape Cake' },
  { slug: 'handbag-shape', name: 'Handbag Shape Cake' },
  { slug: 'helmet-shape', name: 'Helmet Shape Cake' },
  { slug: 'trophy-shape', name: 'Trophy Shape Cake' },
  { slug: 'chocolate', name: 'Chocolate Cake' },
  { slug: 'truffle', name: 'Truffle Cake' },
  { slug: 'red-velvet', name: 'Red Velvet Cake' },
  { slug: 'black-forest', name: 'Black Forest Cake' },
  { slug: 'white-forest', name: 'White Forest Cake' },
  { slug: 'pineapple', name: 'Pineapple Cake' },
  { slug: 'mango', name: 'Mango Cake' },
  { slug: 'strawberry', name: 'Strawberry Cake' },
  { slug: 'blueberry', name: 'Blueberry Cake' },
  { slug: 'butterscotch', name: 'Butterscotch Cake' },
  { slug: 'vanilla', name: 'Vanilla Cake' },
  { slug: 'lemon', name: 'Lemon Cake' },
  { slug: 'coffee', name: 'Coffee Cake' },
  { slug: 'caramel', name: 'Caramel Cake' },
  { slug: 'eggless', name: 'Eggless Cake' },
  { slug: 'sugar-free', name: 'Sugar Free Cake' },
  { slug: 'vegan', name: 'Vegan Cake' },
  { slug: 'gluten-free', name: 'Gluten Free Cake' },
  { slug: 'jar-cake', name: 'Jar Cake' },
  { slug: 'cup-cake', name: 'Cup Cake' },
  { slug: 'mini-cake', name: 'Mini Cake' },
  { slug: 'pastry', name: 'Pastry' },
  { slug: 'brownie', name: 'Brownie' },
  { slug: 'cheesecake', name: 'Cheesecake' },
  { slug: 'mousse', name: 'Mousse Cake' },
  { slug: 'swiss-roll', name: 'Swiss Roll' },
  { slug: 'donut-cake', name: 'Donut Cake' },
  { slug: 'naked-cake', name: 'Naked Cake' },
  { slug: 'drip-cake', name: 'Drip Cake' },
  { slug: 'mirror-glaze', name: 'Mirror Glaze Cake' },
  { slug: 'geode', name: 'Geode Cake' },
  { slug: 'galaxy', name: 'Galaxy Cake' },
  { slug: 'ombre', name: 'Ombre Cake' },
  { slug: 'watercolor', name: 'Watercolor Cake' },
  { slug: 'floral', name: 'Floral Cake' },
  { slug: 'unicorn', name: 'Unicorn Cake' },
  { slug: 'frozen', name: 'Frozen Theme Cake' },
  { slug: 'superhero', name: 'Superhero Cake' },
];

const products = [
  {
    sku: 'CAKE-001',
    name: 'Classic Chocolate Truffle',
    description: 'A decadent chocolate truffle cake made with premium cocoa and layered with rich chocolate ganache.',
    price: 450,
    categorySlug: 'truffle',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    type: 'CAKE'
  },
  {
    sku: 'CAKE-002',
    name: 'Red Velvet Delight',
    description: 'Classic red velvet sponge with smooth cream cheese frosting, perfect for anniversaries and birthdays.',
    price: 550,
    categorySlug: 'red-velvet',
    imageUrl: 'https://images.unsplash.com/photo-1586788224331-947f68671caf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    type: 'CAKE'
  },
  {
    sku: 'CAKE-003',
    name: 'Pineapple Fruit Cake',
    description: 'Light and airy vanilla sponge layered with fresh pineapple chunks and whipped cream.',
    price: 400,
    categorySlug: 'pineapple',
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    type: 'CAKE'
  },
  {
    sku: 'CAKE-004',
    name: 'Kids Spiderman Cake',
    description: 'Superhero themed fondant cake, favorite among kids for birthday celebrations.',
    price: 850,
    categorySlug: 'superhero',
    imageUrl: 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    type: 'CAKE'
  },
  {
    sku: 'CAKE-005',
    name: 'White Forest Gateau',
    description: 'Vanilla sponge cake with white chocolate shavings and cherries.',
    price: 500,
    categorySlug: 'white-forest',
    imageUrl: 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    type: 'CAKE'
  },
]

async function main() {
  console.log('Seeding RC1 Data...')

  // 1. Upsert Branches
  for (const b of branches) {
    await prisma.branch.upsert({
      where: { id: b.id },
      update: { name: b.name, code: b.code, address: b.address, phone: b.phone },
      create: { id: b.id, name: b.name, code: b.code, address: b.address, phone: b.phone }
    })
  }
  console.log('✔ Branches upserted')

  // 2. Upsert Users
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.pin, 10)
    await prisma.user.upsert({
      where: { id: u.id },
      update: { name: u.name, role: u.role, branchId: u.branchId, passwordHash },
      create: { id: u.id, name: u.name, username: u.id, role: u.role, branchId: u.branchId, passwordHash, status: 'ACTIVE' }
    })
  }
  console.log('✔ Users upserted')

  // 3. Upsert Categories
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug }
    })
  }
  console.log('✔ Categories upserted')

  // 4. Upsert Sample Products
  for (const p of products) {
    const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } })
    if (!category) {
      console.warn(`Category ${p.categorySlug} not found for product ${p.sku}`)
      continue
    }

    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, description: p.description, basePrice: p.price, categoryId: category.id, thumbnail: p.imageUrl },
      create: { sku: p.sku, name: p.name, description: p.description, basePrice: p.price, isCustomizable: true, categoryId: category.id, thumbnail: p.imageUrl }
    })
  }
  console.log('✔ Products upserted')

  console.log('Data seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
