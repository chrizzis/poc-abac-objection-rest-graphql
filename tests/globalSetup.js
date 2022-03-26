// import dotenv from 'dotenv'
import Knex from 'knex'
import knexConfigs from '../knexfile.js'
import pool from '../src/db.js'

const knexConfig = knexConfigs['test']
const database = 'express_jwt_test'
const postgresConnection = 'postgres://christianseabrook:@localhost:5432'

// Create the database
async function createTestDatabase() {
  const knex = Knex({
    ...knexConfig,
    connection: postgresConnection
  })

  try {
    await knex.raw(`DROP DATABASE IF EXISTS ${database}`)
    await knex.raw(`CREATE DATABASE ${database}`)
  } catch (error) {
    throw new Error(error)
  }
  // TODO: i dont think i need this, it doesn't seem to change jest behavior (once/watch)
  // finally {
  //   await knex.destroy()
  // }
}

async function createTestTables() {
  const knex = pool
  try {
    // await knex.migrate.rollback()
    await knex.migrate.latest()
  } catch (error) {
    throw new Error(error)
  }
  // TODO: causing jest --watch to crash
  // finally {
  //   await knex.destroy()
  // }
}

export default async () => {
  try {
    await createTestDatabase()
    console.debug(`${database} database successfully created`)

    await createTestTables()
    console.debug(`${database} database tables successfully created`)
  } catch (error) {
    console.debug(error)
    process.exit(1)
  }
}