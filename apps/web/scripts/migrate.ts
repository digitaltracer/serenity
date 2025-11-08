#!/usr/bin/env tsx
/**
 * Database migration script
 * Runs SQL migrations from packages/database/src/schema/schema.sql
 */

import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'
import pg from 'pg'

const { Pool } = pg

// Load environment variables from .env.local
config({ path: join(__dirname, '../.env.local') })

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set')
    console.error('💡 Create a .env.local file with your database connection string')
    process.exit(1)
  }

  console.log('🚀 Starting database migration...')
  console.log(`📦 Connecting to database...`)

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  })

  try {
    // Test connection
    await pool.query('SELECT 1')
    console.log('✅ Connected to database')

    // Read schema file
    const schemaPath = join(__dirname, '../../../packages/database/src/schema/schema.sql')
    console.log(`📄 Reading schema from: ${schemaPath}`)

    const schemaSql = readFileSync(schemaPath, 'utf-8')

    // Execute schema
    console.log('🔨 Executing schema...')
    await pool.query(schemaSql)

    console.log('✅ Migration completed successfully!')

    // Show table count
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `)
    console.log(`📊 Total tables: ${result.rows[0].count}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations()
