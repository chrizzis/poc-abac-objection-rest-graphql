// yarn run knex init - gives a default file that i have to overwrite b/c esm
import { db } from './config/index.js'
import path from 'path'
const __dirname = path.resolve();

const defaults = {
  client: 'pg',
  connection: db.url,
  migrations: {
    // TODO: do i need dirname?
    directory: __dirname + '/migrations'
  },
}

const config = {
  test: {
    ...defaults,
    pool: { min: 0, max: 10, idleTimeoutMillis: 500, },
    seeds: {
      // TODO: temp
      directory: __dirname + '/seeds/development'
      // directory: __dirname + '/seeds/test'
    },
    debug: true
  },
  development: {
    ...defaults,
    seeds: {
      directory: __dirname + '/seeds/development'
    },
    debug: true
  },
  production: {
    ...defaults,
    // Heroku automatically configs this when adding it:
    // heroku addons:create heroku-postgresql:hobby-dev
    // connection: DATABASE_URL,

    // needed for Heroku SSL setup
    ssl: { rejectUnauthorized: false },

    seeds: {
      // TODO: TEMP FOR HEROKU - set this appropriately
      // directory: __dirname + '/seeds/production'
      directory: __dirname + '/seeds/development'
    },
  },
}

export default config;