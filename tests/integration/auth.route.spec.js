import request from 'supertest'
import app from '../../src/app.js'
import pool from '../../src/db.js'
import { verifyJWT } from '../../src/utils/jwt.js'

describe("auth.route.js", () => {
  let knex
  beforeAll(async () => {
    knex = pool
  });
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
      const { user, token } = response.body

      const decodedToken = verifyJWT(token)
      const { createdAt: edtca, exp, iat, ...resDecodedToken } = decodedToken
      expect(resDecodedToken).toMatchSnapshot()

      const { createdAt, ...resUser } = user
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