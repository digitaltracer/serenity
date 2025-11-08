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

    // Check if base tables exist
    const tablesCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `)
    const hasBaseTables = parseInt(tablesCheck.rows[0].count) > 0

    // Run base schema if needed
    if (!hasBaseTables) {
      const schemaPath = join(__dirname, '../../../packages/database/src/schema/schema.sql')
      console.log(`📄 Running base schema from: ${schemaPath}`)
      const schemaSql = readFileSync(schemaPath, 'utf-8')
      await pool.query(schemaSql)
      console.log('✅ Base schema created')
    } else {
      console.log('ℹ️  Base schema already exists, skipping...')
    }

    // Run web-extensions schema
    const webExtensionsPath = join(__dirname, '../../../packages/database/src/schema/web-extensions.sql')
    console.log(`📄 Running web extensions from: ${webExtensionsPath}`)
    const webExtensionsSql = readFileSync(webExtensionsPath, 'utf-8')

    try {
      await pool.query(webExtensionsSql)
      console.log('✅ Web extensions applied')
    } catch (err: any) {
      // Check if error is because tables already exist
      if (err.code === '42P07' || err.code === '42710') {
        console.log('ℹ️  Some web extensions already exist, skipping...')
      } else {
        throw err
      }
    }

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
