import 'dotenv/config';
import { PrismaClient, Role, OrderStatus, DeliveryType, PaymentMethod, PaymentType, PaymentStatus, NotificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting Development Database Seed...');

  // 1. Create Branches
  console.log('Creating Branches...');
  const umaBranch = await prisma.branch.upsert({ where: { code: 'UMA' }, update: {}, create: { name: 'Uma Branch', code: 'UMA', address: 'Uma Char Rasta, Vadodara', phone: '9876543210' } });
  const khdBranch = await prisma.branch.upsert({ where: { code: 'KHD' }, update: {}, create: { name: 'Khanderao Branch', code: 'KHD', address: 'Khanderao Market, Vadodara', phone: '9876543211' } });
  const varBranch = await prisma.branch.upsert({ where: { code: 'VAR' }, update: {}, create: { name: 'Varasiya Branch', code: 'VAR', address: 'Varasiya Ring Road, Vadodara', phone: '9876543212' } });
  const ellBranch = await prisma.branch.upsert({ where: { code: 'ELL' }, update: {}, create: { name: 'Ellora Park Branch', code: 'ELL', address: 'Ellora Park, Vadodara', phone: '9876543213' } });
  console.log('✔ Branches created');

  // 2. Create Users (Staff)
  // IMPORTANT: Default PIN is 1234 (4 digits — matches the login UI keypad)
  console.log('Creating Users...');
  const defaultPassword = await bcrypt.hash('1234', 10);

  // Global Admin (no branch restriction)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' }, update: {},
    create: { name: 'Super Admin', username: 'admin', email: 'admin@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.ADMIN }
  });

  // Uma Branch Staff
  const managerUma = await prisma.user.upsert({
    where: { username: 'manager_uma' }, update: {},
    create: { name: 'Anita Patel (Manager)', username: 'manager_uma', email: 'manager.uma@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.MANAGER, branchId: umaBranch.id }
  });
  const salesperson = await prisma.user.upsert({
    where: { username: 'sales_uma' }, update: {},
    create: { name: 'Ravi Shah (Sales)', username: 'sales_uma', email: 'sales.uma@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.SALESPERSON, branchId: umaBranch.id }
  });
  const chef = await prisma.user.upsert({
    where: { username: 'chef_uma' }, update: {},
    create: { name: 'Chef Sanjeev (Uma)', username: 'chef_uma', email: 'chef.uma@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.CHEF, branchId: umaBranch.id }
  });
  const driver = await prisma.user.upsert({
    where: { username: 'driver_uma' }, update: {},
    create: { name: 'Ramesh Verma (Driver)', username: 'driver_uma', email: 'driver.uma@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.DELIVERY, branchId: umaBranch.id }
  });

  // Khanderao Branch Staff
  await prisma.user.upsert({
    where: { username: 'manager_khd' }, update: {},
    create: { name: 'Deepak Joshi (Manager)', username: 'manager_khd', email: 'manager.khd@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.MANAGER, branchId: khdBranch.id }
  });
  await prisma.user.upsert({
    where: { username: 'sales_khd' }, update: {},
    create: { name: 'Priti Mehta (Sales)', username: 'sales_khd', email: 'sales.khd@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.SALESPERSON, branchId: khdBranch.id }
  });
  await prisma.user.upsert({
    where: { username: 'chef_khd' }, update: {},
    create: { name: 'Chef Mahesh (Khanderao)', username: 'chef_khd', email: 'chef.khd@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.CHEF, branchId: khdBranch.id }
  });
  await prisma.user.upsert({
    where: { username: 'driver_khd' }, update: {},
    create: { name: 'Suresh Patel (Driver)', username: 'driver_khd', email: 'driver.khd@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.DELIVERY, branchId: khdBranch.id }
  });

  // Varasiya Branch Staff
  await prisma.user.upsert({
    where: { username: 'manager_var' }, update: {},
    create: { name: 'Nita Desai (Manager)', username: 'manager_var', email: 'manager.var@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.MANAGER, branchId: varBranch.id }
  });
  await prisma.user.upsert({
    where: { username: 'sales_var' }, update: {},
    create: { name: 'Vijay Kumar (Sales)', username: 'sales_var', email: 'sales.var@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.SALESPERSON, branchId: varBranch.id }
  });
  await prisma.user.upsert({
    where: { username: 'chef_var' }, update: {},
    create: { name: 'Chef Rekha (Varasiya)', username: 'chef_var', email: 'chef.var@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.CHEF, branchId: varBranch.id }
  });
  await prisma.user.upsert({
    where: { username: 'driver_var' }, update: {},
    create: { name: 'Ashok Singh (Driver)', username: 'driver_var', email: 'driver.var@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.DELIVERY, branchId: varBranch.id }
  });

  // Ellora Park Branch Staff
  await prisma.user.upsert({
    where: { username: 'manager_ell' }, update: {},
    create: { name: 'Sunita Rao (Manager)', username: 'manager_ell', email: 'manager.ell@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.MANAGER, branchId: ellBranch.id }
  });
  await prisma.user.upsert({
    where: { username: 'sales_ell' }, update: {},
    create: { name: 'Rohit Gupta (Sales)', username: 'sales_ell', email: 'sales.ell@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.SALESPERSON, branchId: ellBranch.id }
  });
  await prisma.user.upsert({
    where: { username: 'chef_ell' }, update: {},
    create: { name: 'Chef Kavita (Ellora)', username: 'chef_ell', email: 'chef.ell@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.CHEF, branchId: ellBranch.id }
  });
  await prisma.user.upsert({
    where: { username: 'driver_ell' }, update: {},
    create: { name: 'Dinesh Patel (Driver)', username: 'driver_ell', email: 'driver.ell@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.DELIVERY, branchId: ellBranch.id }
  });

  // Vendors (no branch assignment)
  const florist = await prisma.user.upsert({
    where: { username: 'vendor_florist' }, update: {},
    create: { name: 'Sanjay Florist', username: 'vendor_florist', email: 'florist@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.VENDOR_FLORIST }
  });
  const photo = await prisma.user.upsert({
    where: { username: 'vendor_photo' }, update: {},
    create: { name: 'Kamal Photo Studio', username: 'vendor_photo', email: 'photo@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.VENDOR_PHOTO }
  });
  const acrylic = await prisma.user.upsert({
    where: { username: 'vendor_acrylic' }, update: {},
    create: { name: 'Ajay Creative Acrylics', username: 'vendor_acrylic', email: 'acrylic@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.VENDOR_ACRYLIC }
  });

  console.log('✔ Users created for all 4 branches (default PIN: 1234)');

  // 3. Demo Customers
  const customer1 = await prisma.customer.upsert({
    where: { phone: '9998887776' },
    update: {},
    create: { name: 'Priya Sharma', phone: '9998887776', email: 'priya@example.com' }
  });

  // 4. Categories
  console.log('Creating Categories...');
  const catBirthday = await prisma.category.upsert({ where: { slug: 'birthday' }, update: {}, create: { name: 'Birthday Cakes', slug: 'birthday' } });
  const catWedding = await prisma.category.upsert({ where: { slug: 'wedding' }, update: {}, create: { name: 'Wedding Cakes', slug: 'wedding' } });
  const catCustom = await prisma.category.upsert({ where: { slug: 'custom' }, update: {}, create: { name: 'Custom Cakes', slug: 'custom' } });
  const catPhoto = await prisma.category.upsert({ where: { slug: 'photo-cake' }, update: {}, create: { name: 'Photo Cakes', slug: 'photo-cake' } });
  const catCupcake = await prisma.category.upsert({ where: { slug: 'cupcakes' }, update: {}, create: { name: 'Cupcakes', slug: 'cupcakes' } });
  const catFloral = await prisma.category.upsert({ where: { slug: 'floral' }, update: {}, create: { name: 'Fresh Flower Cakes', slug: 'floral' } });
  const catKids = await prisma.category.upsert({ where: { slug: 'kids' }, update: {}, create: { name: "Kids' Cakes", slug: 'kids' } });
  console.log('✔ 7 Categories created');

  // 5. Products (15 real products)
  console.log('Creating Products...');
  const productList = [
    { name: 'Classic Chocolate Truffle', basePrice: 450, categoryId: catBirthday.id, description: 'Rich dark chocolate cake with truffle frosting. Available from 500g.' },
    { name: 'Red Velvet Delight', basePrice: 500, categoryId: catBirthday.id, description: 'Moist red velvet with cream cheese frosting.' },
    { name: 'Vanilla Bean Dream', basePrice: 400, categoryId: catBirthday.id, description: 'Light vanilla sponge with whipped cream. Great for all ages.' },
    { name: 'Butterscotch Paradise', basePrice: 420, categoryId: catBirthday.id, description: 'Classic butterscotch flavour with crunchy praline topping.' },
    { name: 'Black Forest Gateau', basePrice: 480, categoryId: catBirthday.id, description: 'German-style chocolate and cherry cake with whipped cream layers.' },
    { name: 'Pineapple Cream Cake', basePrice: 380, categoryId: catBirthday.id, description: 'Fresh pineapple with light cream — a crowd favourite.' },
    { name: 'Photo Print Cake', basePrice: 550, categoryId: catPhoto.id, description: 'Edible photo print on premium cream cake. Upload your photo at checkout.', isCustom: true },
    { name: 'Vintage Photo Collage Cake', basePrice: 700, categoryId: catPhoto.id, description: 'Multiple photo prints arranged in a beautiful vintage collage design.', isCustom: true },
    { name: 'Fresh Rose Petal Cake', basePrice: 800, categoryId: catFloral.id, description: 'Decorated with fresh natural rose petals. Delivered same-day for freshness.' },
    { name: 'Unicorn Fantasy Cake', basePrice: 650, categoryId: catKids.id, description: 'Pastel rainbow layers with fondant unicorn topper. Perfect for little ones.' },
    { name: 'Dinosaur Adventure Cake', basePrice: 600, categoryId: catKids.id, description: 'Green jungle theme with fondant dinosaur figures.' },
    { name: 'Assorted Cupcake Box (6 pcs)', basePrice: 350, categoryId: catCupcake.id, description: 'Box of 6 cupcakes in assorted flavours with premium frosting.' },
    { name: 'Bespoke Wedding Tier Cake', basePrice: 2500, categoryId: catWedding.id, description: 'Custom 3-tier wedding cake. Price per kg, minimum 3kg.', isCustom: true },
    { name: 'Custom Design Cake', basePrice: 600, categoryId: catCustom.id, description: 'Bring your own design! Upload reference images and our artists will create it.', isCustom: true },
    { name: 'Mango Mousse Cake', basePrice: 500, categoryId: catBirthday.id, description: 'Seasonal summer special with real mango pulp mousse layers.' },
  ];

  for (const p of productList) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          basePrice: p.basePrice,
          description: p.description,
          category: { connect: { id: p.categoryId } },
          availableForSale: true,
          isArchived: false,
          isCustomizable: (p as any).isCustom || false,
        }
      });
    }
  }
  console.log(`✔ ${productList.length} Products created`);

  // 6. Design Reference
  const design1 = await prisma.design.upsert({
    where: { code: 'DSN-B-001' },
    update: {},
    create: {
      code: 'DSN-B-001',
      name: 'Classic Chocolate Truffle',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      categories: { create: { categoryId: catBirthday.id } }
    }
  });

  // 7. Coupons
  await prisma.coupon.upsert({ where: { code: 'WELCOME10' }, update: {}, create: { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10, isActive: true } });
  await prisma.coupon.upsert({ where: { code: 'FLAT50' }, update: {}, create: { code: 'FLAT50', discountType: 'FLAT', discountValue: 50, isActive: true, minOrderValue: 500 } });

  // 8. Settings
  await prisma.settings.upsert({ where: { key: 'customerImageRetentionDays' }, update: {}, create: { key: 'customerImageRetentionDays', value: '30', description: 'Days to keep customer reference images' } });
  await prisma.settings.upsert({ where: { key: 'whatsappEnabled' }, update: {}, create: { key: 'whatsappEnabled', value: 'true', description: 'Global toggle for WhatsApp notifications' } });
  await prisma.settings.upsert({ where: { key: 'couponEnabled' }, update: {}, create: { key: 'couponEnabled', value: 'true', description: 'Global toggle for Coupons' } });
  await prisma.settings.upsert({ where: { key: 'delayThresholdMinutes' }, update: {}, create: { key: 'delayThresholdMinutes', value: '15', description: 'Minutes before an order is marked delayed' } });
  await prisma.settings.upsert({ where: { key: 'GST_RATE' }, update: {}, create: { key: 'GST_RATE', value: '0', description: 'GST rate in percentage (0 = none)' } });
  await prisma.settings.upsert({ where: { key: 'DELIVERY_CHARGE' }, update: {}, create: { key: 'DELIVERY_CHARGE', value: '100', description: 'Default delivery charge in INR' } });
  await prisma.settings.upsert({ where: { key: 'STORE_ACCEPTING_ORDERS' }, update: {}, create: { key: 'STORE_ACCEPTING_ORDERS', value: 'true', description: 'Toggle to pause all online orders' } });
  console.log('✔ Settings created');

  // 9. Demo Orders for dashboard testing
  console.log('Creating Demo Orders...');

  // Order 1: NEW — awaiting sales approval
  await prisma.order.upsert({
    where: { orderNumber: 'ORD-UMA-1001' },
    update: {},
    create: {
      orderNumber: 'ORD-UMA-1001',
      trackingId: 'GCS-DEMO-0001',
      customerId: customer1.id,
      branchId: umaBranch.id,
      status: OrderStatus.NEW,
      deliveryType: DeliveryType.PICKUP,
      targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      subtotal: 500, totalAmount: 500,
      items: { create: { quantity: 1, weight: 1, flavor: 'Chocolate', price: 500, productName: 'Classic Chocolate Truffle' } },
      timeline: { create: { nextState: OrderStatus.NEW, status: OrderStatus.NEW, action: 'checkout', role: 'SALESPERSON', actorId: salesperson.id, note: 'Online order placed' } }
    }
  });

  // Order 2: WAITING_FOR_CHEF — approved, ready for kitchen
  await prisma.order.upsert({
    where: { orderNumber: 'ORD-UMA-1002' },
    update: {},
    create: {
      orderNumber: 'ORD-UMA-1002',
      trackingId: 'GCS-DEMO-0002',
      customerId: customer1.id,
      branchId: umaBranch.id,
      status: OrderStatus.WAITING_FOR_CHEF,
      deliveryType: DeliveryType.DELIVERY,
      targetDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      subtotal: 700, deliveryCharge: 50, totalAmount: 750,
      deliveryAddress: 'Plot 12, Alkapuri Society, Vadodara 390007',
      items: {
        create: {
          quantity: 1, weight: 1.5, flavor: 'Truffle', price: 700, productName: 'Classic Chocolate Truffle',
          designId: design1.id, designCode: design1.code, designName: design1.name, designImageUrl: design1.imageUrl
        }
      },
      payments: { create: { amount: 750, method: PaymentMethod.UPI, type: PaymentType.FULL, status: PaymentStatus.SUCCESS } },
      timeline: {
        createMany: {
          data: [
            { nextState: OrderStatus.NEW, status: OrderStatus.NEW, action: 'checkout', role: 'SALESPERSON', actorId: salesperson.id },
            { nextState: OrderStatus.WAITING_FOR_CHEF, status: OrderStatus.WAITING_FOR_CHEF, action: 'approve', role: 'SALESPERSON', actorId: salesperson.id }
          ]
        }
      },
      notifications: { create: { recipient: customer1.phone, channel: 'WHATSAPP', templateName: 'order_confirmed', status: NotificationStatus.SENT } }
    }
  });

  // Order 3: CHEF_ACCEPTED — chef is making it
  await prisma.order.upsert({
    where: { orderNumber: 'ORD-UMA-1003' },
    update: {},
    create: {
      orderNumber: 'ORD-UMA-1003',
      trackingId: 'GCS-DEMO-0003',
      customerId: customer1.id,
      branchId: umaBranch.id,
      chefId: chef.id,
      status: OrderStatus.CHEF_ACCEPTED,
      deliveryType: DeliveryType.PICKUP,
      targetDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      subtotal: 1000, totalAmount: 1000,
      items: { create: { quantity: 1, weight: 2, flavor: 'Red Velvet', price: 1000, productName: 'Red Velvet Delight' } },
      timeline: {
        createMany: {
          data: [
            { nextState: OrderStatus.NEW, status: OrderStatus.NEW, action: 'checkout', role: 'SALESPERSON', actorId: salesperson.id },
            { nextState: OrderStatus.WAITING_FOR_CHEF, status: OrderStatus.WAITING_FOR_CHEF, action: 'approve', role: 'SALESPERSON', actorId: salesperson.id },
            { nextState: OrderStatus.CHEF_ACCEPTED, status: OrderStatus.CHEF_ACCEPTED, action: 'chef-accept', role: 'CHEF', actorId: chef.id }
          ]
        }
      }
    }
  });

  console.log('✔ Demo Orders created');
  console.log('');
  console.log('=== SEED COMPLETE ✅ ===');
  console.log('Default PIN for all staff: 1234');
  console.log('Branches: UMA, KHD, VAR, ELL (each with manager, sales, chef, driver)');
  console.log(`Products: ${productList.length} seeded`);
  console.log('Demo tracking IDs: GCS-DEMO-0001, GCS-DEMO-0002, GCS-DEMO-0003');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
