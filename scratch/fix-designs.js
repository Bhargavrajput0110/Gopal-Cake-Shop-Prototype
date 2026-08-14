require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Beautiful placeholder images from Unsplash for each design
const DESIGN_FIXES = {
  'cmssrxsia0000scu3rmfthl0p': { // Bow Cake
    imageUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&auto=format&fit=crop&q=80'
  },
  'cmsagrsnc0000jsu31sai6j98': { // Defender Car Cake
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80'
  },
  'cms228iwj000dlou3tuc0tp2d': { // Classic Chocolate Truffle
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80'
  },
  'cmriuhyob00012su3o7y2c459': { // Spider-Man
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568a70950?w=600&auto=format&fit=crop&q=80'
  }
};

// RBAC test designs to delete
const TO_DELETE = [
  'cmrhly2za000038u39lw35i6k',
  'cmrhly41d000138u36frsyew2',
  'cmrhly61g000238u3zpuujxtk',
  'cmrhly6y1000338u3t9jqyhdz',
  'cmrhly8ov000438u32w429o7p',
  'cmrhly9ng000538u36h9cn688',
  'cmrhlz4hm00000wu3vqkvcju6',
];

async function fixDesigns() {
  // Delete junk RBAC test designs
  const ids = TO_DELETE.map(id => `'${id}'`).join(', ');
  const del = await pool.query(`DELETE FROM "Design" WHERE id IN (${ids})`);
  console.log(`Deleted ${del.rowCount} junk RBAC test designs.`);

  // Fix broken image URLs
  for (const [id, fix] of Object.entries(DESIGN_FIXES)) {
    await pool.query(
      `UPDATE "Design" SET "imageUrl" = $1 WHERE id = $2`,
      [fix.imageUrl, id]
    );
    console.log(`Fixed image for design ${id}`);
  }

  // Final list
  const { rows } = await pool.query('SELECT id, name, code, "imageUrl" FROM "Design" ORDER BY name ASC');
  console.log(`\nFinal designs (${rows.length} total):`);
  rows.forEach(r => console.log(`  [${r.code}] ${r.name} — ${r.imageUrl?.substring(0, 60)}...`));
}

fixDesigns().catch(console.error).finally(() => pool.end());
