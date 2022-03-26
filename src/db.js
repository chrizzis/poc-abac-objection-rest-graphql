import knex from 'knex'
import knexConfigs from '../knexfile.js'
import { currentEnv } from '../config/index.js'

const knexConfig = knexConfigs[currentEnv]

export default knex(knexConfig)