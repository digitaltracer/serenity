#!/usr/bin/env tsx
/**
 * Database seeding script
 * Seeds the database with sample data for development
 */

import pg from 'pg'

const { Pool } = pg

async function seedDatabase() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  console.log('🌱 Starting database seeding...')

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  })

  try {
    // Check if we already have data
    const userCheck = await pool.query('SELECT COUNT(*) as count FROM users')
    if (parseInt(userCheck.rows[0].count) > 0) {
      console.log('⚠️  Database already has data. Skipping seed.')
      console.log('💡 To re-seed, first clear the database.')
      process.exit(0)
    }

    console.log('📝 Creating sample user...')
    const userResult = await pool.query(`
      INSERT INTO users (name, email, preferences)
      VALUES ($1, $2, $3)
      RETURNING id
    `, ['Test User', 'test@example.com', JSON.stringify({
      theme: 'system',
      compactMode: false,
      notifications: {
        enabled: true,
        sounds: true,
        taskReminders: true,
        dailyReview: false,
      },
      language: 'en',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
    })])

    const userId = userResult.rows[0].id
    console.log(`✅ Created user with ID: ${userId}`)

    console.log('📁 Creating sample project...')
    const projectResult = await pool.query(`
      INSERT INTO projects (user_id, name, description, color)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [userId, 'Sample Project', 'This is a sample project', '#3B82F6'])

    const projectId = projectResult.rows[0].id
    console.log(`✅ Created project with ID: ${projectId}`)

    console.log('✅ Seeding completed successfully!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seedDatabase()
