import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
const __dirname = path.resolve()

const { NODE_ENV } = process.env
const envFile = `/.env.${NODE_ENV}`
try {
  if (fs.existsSync(path.join(__dirname, envFile))) {
    dotenv.config({ path: path.join(__dirname, `/.env.${NODE_ENV}`) })
  } else {
    throw new Error('file not found')
  }
} catch (e) {
  if (NODE_ENV == 'production') {
    throw new Error(`TODO: prod:heroku?`)
    // dotenv.config({ path: path.join(__dirname, `/.env`) })
  } else {
    // console.error(`config: ${e}`)
    // console.error(`.env.${NODE_ENV} NOT FOUND!`)
    // console.error(`using .env.example`)
    dotenv.config({ path: path.join(__dirname, `/.env.example`) })
  }
}

const {
  PORT: port = 3000,
  SECRET: secret,
  API_VERSION: version,
  REST_API_BASE: apiBase,
  DATABASE_URL,
  DEV_DB_URL,
  TEST_DB_URL,
} = process.env

const apiUrl = `${apiBase}/${version}`

// boolean checks
const env = {
  development: NODE_ENV === 'development',
  test: NODE_ENV === 'test',
  staging: NODE_ENV === 'staging',
  production: NODE_ENV === 'production'
}

let dbUrl = {
  development: DEV_DB_URL,
  test: TEST_DB_URL,
  // Heroku automatically configs this when adding it:
  // heroku addons:create heroku-postgresql:hobby-dev
  production: DATABASE_URL,
}

// TODO: used in knex config ctx
let currentEnv
try {
  currentEnv = Object.entries(env).find(state => {
    return !!state[1]
  })[0]
} catch (e) {
  throw new Error('currentEnv not populated')
}

// Database
const db = {
  url: dbUrl[currentEnv]
}

export { port, currentEnv, env, apiUrl, secret, db, version }