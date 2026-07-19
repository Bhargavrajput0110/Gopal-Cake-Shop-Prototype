import { Pool } from 'pg'

async function run() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || ''
  
  const pool = new Pool({
    connectionString,
    options: '-c search_path=postgres_test,public'
  })

  const res = await pool.query('SHOW search_path')
  console.log('SEARCH PATH IS:', res.rows[0])
  pool.end()
}

run().catch(console.error)
