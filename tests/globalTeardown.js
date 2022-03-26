// import dotenv from 'dotenv'
import Knex from 'knex'
import knexConfigs from '../knexfile.js'

const knexConfig = knexConfigs['test']
const database = 'express_jwt_test'
const postgresConnection = 'postgres://christianseabrook:@localhost:5432'

export default async () => {
  // NOTE: knex instance must be freshly created for each globalTeardown (jest --watch destroys b/t tests)
  const knex = Knex({
    ...knexConfig,
    connection: postgresConnection
  })
  try {
    await knex.raw(`DROP DATABASE IF EXISTS ${database}`)
    console.debug(`${database} database successfully dropped`)
    await knex.destroy()
    // TODO: properly close graphql server on teardown (i think this is causing `error Command failed with exit code 1.` on test:once)
    // await global.httpServer.server.close()
  } catch (error) {
    console.debug(error)
    process.exit(1)
  }
}