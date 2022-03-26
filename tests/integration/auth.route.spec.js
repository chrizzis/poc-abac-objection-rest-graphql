import request from 'supertest'
import app from '../../src/app.js'
import { currentEnv } from '../../config/index.js'
import pool from '../../src/db.js'
import { Model } from 'objection'
import { verifyJWT } from '../../src/utils/jwt.js'

// import Knex from 'knex'
// import knexConfigs from '../../knexfile.js'

// const knexConfig = knexConfigs[currentEnv]
// const knex = Knex(knexConfig);

describe("auth.route.js", () => {
  let knex
  beforeAll(async () => {
    // knex = Knex(knexConfig);
    knex = pool
    // TODO: knex.seed doesnt reset increment counter
    // knex.raw('ALTER TABLE ' + 'your_table' + ' AUTO_INCREMENT = 1');
    // Model.knex(knex) // not needed for tests to pass, not using objection here...
    // await knex.migrate.rollback();
    // await knex.migrate.latest(); // done in global setup
    // await knex.raw('TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;')
    // await knex.raw('TRUNCATE TABLE "Project" RESTART IDENTITY CASCADE;')
    // await knex.seed.run(); // TODO: if kept here, can't destroy data in any tests that other tests rely on
  });
  beforeEach(async () => {
    // await knex.seed.run();
  });
  // TODO: this isnt needed b/c globalTeardown
  // afterAll(async () => {
  //   await knex.destroy()
  // })
  describe(`/login`, () => {
    test("successful login should return status 200 with token", async () => {
      const dbUsers = await knex('User');
      const dbuser = dbUsers[0]
      const { username, password } = dbuser
      const query = {
        username,
        password
      }

      const response = await request(app).post(`/login`).send(query).expect(200);
      console.debug(`response.body: ${JSON.stringify(response.body)}`)
      const { user, token } = response.body

      const decodedToken = verifyJWT(token)
      const { createdAt: edtca, exp, iat, ...resDecodedToken } = decodedToken
      expect(resDecodedToken).toMatchSnapshot()

      const { createdAt, ...resUser } = user
      // TODO: apparently the pg driver converts the db timestamp string to a js Date object
      // https://stackoverflow.com/questions/51082774/knex-silently-converts-postgres-timestamps-with-timezone-and-returns-incorrect-t
      expect(resUser).toMatchSnapshot()

    });
    test("login attempt with invalid credentials should return status 401", async () => {
      const query = {
        username: 'incorrect',
        password: 'incorrect',
      }
      await request(app).post(`/login`).send(query).expect(401);
    });
    test("login attempt with incomplete credentials should return status 401", async () => {
      const dbUsers = await knex('User');
      const { username, password } = dbUsers[0]
      await request(app).post(`/login`).send({ username }).expect(401);
      await request(app).post(`/login`).send({ password }).expect(401);
      await request(app).post(`/login`).send({}).expect(401);
    });
  });
});