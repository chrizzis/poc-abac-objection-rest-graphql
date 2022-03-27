import knexConfigs from '../knexfile.js'
import pool from '../src/db.js'

const knexConfig = knexConfigs['test']
const database = 'express_jwt_test'
const postgresConnection = 'postgres://christianseabrook:@localhost:5432'

async function seedTestDatabase() {
  const knex = pool
  try {
    await knex.raw('TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;')
    await knex.raw('TRUNCATE TABLE "Project" RESTART IDENTITY CASCADE;')
    await knex.seed.run()
  } catch (error) {
    throw new Error(error)
  }
}

try {
  await seedTestDatabase()
  console.debug(`${database} database successfully seeded`)
} catch (error) {
  console.debug(error)
  process.exit(1)
}