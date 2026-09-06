import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

// Staff with real phone numbers → password = last 4 digits
const staffPasswords: { email: string; last4: string }[] = [
  // ADMIN
  { email: 'rishi_admin@gopalcake.internal',       last4: '2132' },
  // SALESPERSON
  { email: 'amit_market@gopalcake.internal',        last4: '3321' },
  { email: 'amla_market@gopalcake.internal',        last4: '0092' },
  { email: 'deepak_uma@gopalcake.internal',         last4: '5443' },
  { email: 'golu_uma@gopalcake.internal',           last4: '1653' },
  { email: 'kapil_ellora@gopalcake.internal',       last4: '8045' },
  { email: 'naresh_warasiya@gopalcake.internal',    last4: '9315' },
  { email: 'om_ellora@gopalcake.internal',          last4: '7804' },
  { email: 'pavan_allrounder@gopalcake.internal',   last4: '1400' },
  { email: 'sanket_uma@gopalcake.internal',         last4: '6894' },
  { email: 'tushar_uma@gopalcake.internal',         last4: '0680' },
  { email: 'twinkle_uma@gopalcake.internal',        last4: '4524' },
  { email: 'vansha_uma@gopalcake.internal',         last4: '1486' },
  // CHEF
  { email: 'akshay_uma@gopalcake.internal',         last4: '3904' },
  { email: 'arun_ellora@gopalcake.internal',        last4: '5206' },
  { email: 'dipu_warasiya@gopalcake.internal',      last4: '9436' },
  { email: 'lavkush_uma@gopalcake.internal',        last4: '6002' },
  { email: 'pardeep_uma@gopalcake.internal',        last4: '8180' },
  { email: 'prince_uma@gopalcake.internal',         last4: '3838' },
  { email: 'raaz_market@gopalcake.internal',        last4: '2696' },
  { email: 'rajpal_uma@gopalcake.internal',         last4: '4482' },
  { email: 'royal_market@gopalcake.internal',       last4: '5150' },
  { email: 'rubel_market@gopalcake.internal',       last4: '1559' },
  { email: 'sachin_warasiya@gopalcake.internal',    last4: '0350' },
  { email: 'shravan_warasiya@gopalcake.internal',   last4: '1741' },
  { email: 'sunil_uma@gopalcake.internal',          last4: '3843' },
  // DELIVERY
  { email: 'baggi_global@gopalcake.internal',       last4: '3563' },
  { email: 'haru_warasiya@gopalcake.internal',      last4: '0890' },
  { email: 'hitu_warasiya@gopalcake.internal',      last4: '0336' },
  { email: 'manoj_warasiya@gopalcake.internal',     last4: '8707' },
  { email: 'pari_warasiya@gopalcake.internal',      last4: '8788' },
  { email: 'pritesh_global@gopalcake.internal',     last4: '1899' },
];

async function run() {
  console.log('Setting passwords (last 4 digits of phone)...\n');
  const SALT_ROUNDS = 10;

  for (const s of staffPasswords) {
    const hash = await bcrypt.hash(s.last4, SALT_ROUNDS);
    const result = await prisma.user.updateMany({
      where: { email: s.email },
      data: { passwordHash: hash }
    });
    const status = result.count > 0 ? '✅' : '⚠️  NOT FOUND';
    console.log(`${status}  ${s.email.padEnd(45)}  pw: ${s.last4}`);
  }

  console.log('\nDone. All eligible staff passwords set.');
}

run().catch(console.error).finally(() => prisma.$disconnect());
