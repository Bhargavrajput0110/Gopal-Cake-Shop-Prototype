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

  // 3. Create Branches
  console.log('Creating Branches...');
  const umaBranch = await prisma.branch.upsert({ where: { code: 'UMA' }, update: {}, create: { name: 'Uma Branch', code: 'UMA', address: 'Uma Char Rasta', phone: '9876543210' } });
  const khdBranch = await prisma.branch.upsert({ where: { code: 'KHD' }, update: {}, create: { name: 'Khanderao Branch', code: 'KHD', address: 'Khanderao Market', phone: '9876543211' } });
  const varBranch = await prisma.branch.upsert({ where: { code: 'VAR' }, update: {}, create: { name: 'Varasiya Branch', code: 'VAR', address: 'Varasiya Ring Road', phone: '9876543212' } });
  const ellBranch = await prisma.branch.upsert({ where: { code: 'ELL' }, update: {}, create: { name: 'Ellora Park Branch', code: 'ELL', address: 'Ellora Park', phone: '9876543213' } });

  // 4. Create Users (Staff)
  console.log('Creating Users...');
  const defaultPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({ where: { username: 'admin' }, update: {}, create: { name: 'Super Admin', username: 'admin', email: 'admin@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.ADMIN } });
  const manager = await prisma.user.upsert({ where: { username: 'manager_uma' }, update: {}, create: { name: 'Manager (Uma)', username: 'manager_uma', email: 'manager@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.MANAGER, branchId: umaBranch.id } });
  const salesperson = await prisma.user.upsert({ where: { username: 'sales_uma' }, update: {}, create: { name: 'Ravi (Sales Uma)', username: 'sales_uma', email: 'sales@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.SALESPERSON, branchId: umaBranch.id } });
  const chef = await prisma.user.upsert({ where: { username: 'chef_uma' }, update: {}, create: { name: 'Chef Sanjeev (Uma)', username: 'chef_uma', email: 'chef@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.CHEF, branchId: umaBranch.id } });
  const driver = await prisma.user.upsert({ where: { username: 'driver_1' }, update: {}, create: { name: 'Ramesh (Delivery)', username: 'driver_1', email: 'driver@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.DELIVERY, branchId: umaBranch.id } });
  const florist = await prisma.user.upsert({ where: { username: 'vendor_florist' }, update: {}, create: { name: 'Sanjay Florist', username: 'vendor_florist', email: 'florist@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.VENDOR_FLORIST } });
  const photo = await prisma.user.upsert({ where: { username: 'vendor_photo' }, update: {}, create: { name: 'Kamal Photo', username: 'vendor_photo', email: 'photo@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.VENDOR_PHOTO } });
  const acrylic = await prisma.user.upsert({ where: { username: 'vendor_acrylic' }, update: {}, create: { name: 'Ajay Acrylic', username: 'vendor_acrylic', email: 'acrylic@gopalcakeshop.com', passwordHash: defaultPassword, role: Role.VENDOR_ACRYLIC } });

  console.log('✔ Users created');

  // 3. Create Demo Customers
  const customer1 = await prisma.customer.upsert({
    where: { phone: '9998887776' },
    update: {},
    create: { name: 'Priya Sharma', phone: '9998887776', email: 'priya@example.com' }
  });

  // 4. Create CMS Categories & Designs
  const catBirthday = await prisma.category.upsert({
    where: { slug: 'birthday' },
    update: {},
    create: { name: 'Birthday Cakes', slug: 'birthday' }
  });

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

  // 5. Create Coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10, isActive: true }
  });

  // 5.5 Create Default Settings
  await prisma.settings.upsert({ where: { key: 'customerImageRetentionDays' }, update: {}, create: { key: 'customerImageRetentionDays', value: '30', description: 'Days to keep customer reference images' } });
  await prisma.settings.upsert({ where: { key: 'whatsappEnabled' }, update: {}, create: { key: 'whatsappEnabled', value: 'true', description: 'Global toggle for WhatsApp notifications' } });
  await prisma.settings.upsert({ where: { key: 'couponEnabled' }, update: {}, create: { key: 'couponEnabled', value: 'true', description: 'Global toggle for Coupons' } });
  await prisma.settings.upsert({ where: { key: 'delayThresholdMinutes' }, update: {}, create: { key: 'delayThresholdMinutes', value: '15', description: 'Minutes before an order is marked delayed' } });

  console.log('✔ Basic references and Settings created');

  // 6. Demo Orders & Timelines
  console.log('Creating Demo Orders...');
  
  // Order 1: Draft
  const order1 = await prisma.order.upsert({
    where: { orderNumber: 'ORD-UMA-1001' },
    update: {},
    create: {
      orderNumber: 'ORD-UMA-1001',
      customerId: customer1.id,
      branchId: umaBranch.id,
      status: OrderStatus.DRAFT,
      deliveryType: DeliveryType.PICKUP,
      targetDate: new Date(),
      subtotal: 500,
      totalAmount: 500,
      items: {
        create: { quantity: 1, weight: 1, flavor: 'Chocolate', price: 500, productName: 'Chocolate Cake' }
      },
      timeline: {
        create: { nextState: OrderStatus.DRAFT, status: OrderStatus.DRAFT, action: 'checkout', role: 'SALES', actorId: salesperson.id, note: 'Draft created' }
      }
    }
  });

  // Order 2: Waiting for Chef
  const order2 = await prisma.order.upsert({
    where: { orderNumber: 'ORD-UMA-1002' },
    update: {},
    create: {
      orderNumber: 'ORD-UMA-1002',
      customerId: customer1.id,
      branchId: umaBranch.id,
      status: OrderStatus.WAITING_FOR_CHEF,
      deliveryType: DeliveryType.DELIVERY,
      targetDate: new Date(),
      subtotal: 700,
      deliveryCharge: 50,
      totalAmount: 750,
      designId: design1.id,
      designCode: design1.code,
      designName: design1.name,
      designImageUrl: design1.imageUrl,
      items: {
        create: { quantity: 1, weight: 1.5, flavor: 'Truffle', price: 700, productName: 'Truffle Cake' }
      },
      payments: {
        create: { amount: 750, method: PaymentMethod.UPI, type: PaymentType.FULL, status: PaymentStatus.SUCCESS }
      },
      timeline: {
        createMany: {
          data: [
            { nextState: OrderStatus.NEW, status: OrderStatus.NEW, action: 'checkout', role: 'SALES', actorId: salesperson.id },
            { nextState: OrderStatus.WAITING_FOR_CHEF, status: OrderStatus.WAITING_FOR_CHEF, action: 'approve', role: 'SALES', actorId: salesperson.id }
          ]
        }
      },
      notifications: {
        create: { recipient: customer1.phone, channel: 'WHATSAPP', templateName: 'order_confirmed', status: NotificationStatus.SENT }
      }
    }
  });

  // Order 3: Chef Accepted
  const order3 = await prisma.order.upsert({
    where: { orderNumber: 'ORD-UMA-1003' },
    update: {},
    create: {
      orderNumber: 'ORD-UMA-1003',
      customerId: customer1.id,
      branchId: umaBranch.id,
      chefId: chef.id,
      status: OrderStatus.CHEF_ACCEPTED,
      deliveryType: DeliveryType.PICKUP,
      targetDate: new Date(),
      subtotal: 1000,
      totalAmount: 1000,
      items: {
        create: { quantity: 1, weight: 2, flavor: 'Red Velvet', price: 1000, productName: 'Red Velvet Cake' }
      },
      timeline: {
        createMany: {
          data: [
            { nextState: OrderStatus.NEW, status: OrderStatus.NEW, action: 'checkout', role: 'SALES', actorId: salesperson.id },
            { nextState: OrderStatus.WAITING_FOR_CHEF, status: OrderStatus.WAITING_FOR_CHEF, action: 'approve', role: 'SALES', actorId: salesperson.id },
            { nextState: OrderStatus.CHEF_ACCEPTED, status: OrderStatus.CHEF_ACCEPTED, action: 'chef-accept', role: 'CHEF', actorId: chef.id }
          ]
        }
      }
    }
  });

  console.log('✔ Orders, Timelines, and Notifications created');
  console.log('Development database seed completed successfully! 🚀');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
