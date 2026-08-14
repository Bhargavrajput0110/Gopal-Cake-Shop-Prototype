import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const OFFICIAL_STAFF = {
  Admin: [
    { username: 'usr_admin', name: 'Rishi Bhai', email: 'admin@gopalcakeshop.com', role: Role.ADMIN, branch: null }
  ],
  Uma: {
    code: 'UMA',
    staff: [
      { username: 'usr_manager_uma', name: 'Manager Uma', role: Role.MANAGER },
      { username: 'usr_sales_sanket', name: 'Sanket', role: Role.SALESPERSON },
      { username: 'usr_sales_tushar', name: 'Tushar', role: Role.SALESPERSON },
      { username: 'usr_sales_vansha', name: 'Vansha', role: Role.SALESPERSON },
      { username: 'usr_sales_deepak', name: 'Deepak', role: Role.SALESPERSON },
      { username: 'usr_sales_twinkle', name: 'Twinkle', role: Role.SALESPERSON },
      { username: 'usr_sales_golu', name: 'Golu', role: Role.SALESPERSON },
      { username: 'usr_chef_lavkush', name: 'Lavkush', role: Role.CHEF },
      { username: 'usr_chef_prince', name: 'Prince', role: Role.CHEF },
      { username: 'usr_chef_sunil', name: 'Sunil', role: Role.CHEF },
      { username: 'usr_chef_pardeep', name: 'Pardeep', role: Role.CHEF },
      { username: 'usr_helper_akshay', name: 'Akshay', role: Role.CHEF },
      { username: 'usr_helper_rajpal', name: 'Rajpal', role: Role.CHEF },
      { username: 'usr_delivery_pavan', name: 'Pavan Bhai (Uma)', role: Role.DELIVERY }
    ]
  },
  Warasiya: {
    code: 'VAR',
    staff: [
      { username: 'usr_sales_naresh', name: 'Naresh', role: Role.SALESPERSON },
      { username: 'usr_sales_pavan_factory', name: 'Pavan Bhai (Factory Sales)', role: Role.SALESPERSON },
      { username: 'usr_chef_sachin', name: 'Sachin', role: Role.CHEF },
      { username: 'usr_chef_dipu', name: 'Dipu', role: Role.CHEF },
      { username: 'usr_chef_shravan', name: 'Shravan', role: Role.CHEF },
      { username: 'usr_delivery_haru', name: 'Haru', role: Role.DELIVERY },
      { username: 'usr_delivery_manoj', name: 'Manoj', role: Role.DELIVERY },
      { username: 'usr_delivery_pari', name: 'Pari', role: Role.DELIVERY },
      { username: 'usr_delivery_hitu', name: 'Hitu', role: Role.DELIVERY },
      { username: 'usr_delivery_pavan_factory', name: 'Pavan Bhai (Factory Delivery)', role: Role.DELIVERY }
    ]
  },
  Khanderao: {
    code: 'KHD',
    staff: [
      { username: 'usr_sales_amit', name: 'Amit', role: Role.SALESPERSON },
      { username: 'usr_sales_amla', name: 'Amla', role: Role.SALESPERSON },
      { username: 'usr_chef_rubel', name: 'Rubel', role: Role.CHEF },
      { username: 'usr_chef_raaz', name: 'Raaz', role: Role.CHEF }
    ]
  },
  Ellora: {
    code: 'ELL',
    staff: [
      { username: 'usr_sales_om', name: 'Om', role: Role.SALESPERSON },
      { username: 'usr_sales_kapil', name: 'Kapil', role: Role.SALESPERSON },
      { username: 'usr_chef_arun', name: 'Arun', role: Role.CHEF }
    ]
  }
};

async function main() {
  console.log('📦 Starting Official Staff Import...');
  const defaultPassword = await bcrypt.hash('1234', 10);

  // 1. Process Admin
  for (const admin of OFFICIAL_STAFF.Admin) {
    await prisma.user.upsert({
      where: { username: admin.username },
      update: { role: admin.role, name: admin.name },
      create: { 
        name: admin.name, 
        username: admin.username, 
        email: admin.email, 
        passwordHash: defaultPassword, 
        role: admin.role 
      }
    });
    console.log(`✅ Upserted Admin: ${admin.username}`);
  }

  // 2. Process Branches
  const branches = [OFFICIAL_STAFF.Uma, OFFICIAL_STAFF.Warasiya, OFFICIAL_STAFF.Khanderao, OFFICIAL_STAFF.Ellora];

  for (const branch of branches) {
    const dbBranch = await prisma.branch.findUnique({ where: { code: branch.code } });
    if (!dbBranch) {
      console.warn(`⚠️ Branch not found in DB: ${branch.code}`);
      continue;
    }

    for (const staff of branch.staff) {
      const email = `${staff.username}@gopalcakeshop.com`;
      await prisma.user.upsert({
        where: { username: staff.username },
        update: { role: staff.role, name: staff.name, branchId: dbBranch.id },
        create: { 
          name: staff.name, 
          username: staff.username, 
          email: email, 
          passwordHash: defaultPassword, 
          role: staff.role,
          branchId: dbBranch.id
        }
      });
      console.log(`✅ Upserted ${staff.role} in ${branch.code}: ${staff.username}`);
    }
  }

  console.log('🚀 Staff Import Completed Successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
