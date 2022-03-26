import request from 'supertest'
import app from '../../src/app.js'
import { apiUrl, currentEnv } from '../../config/index.js'
import pool from '../../src/db.js'
import { Model } from 'objection'
import { generateJWT } from '../../src/utils/jwt.js'
import { filterDynamic } from '../helpers/index.js'

// import Knex from 'knex'
// import knexConfigs from '../../knexfile.js'

// const knexConfig = knexConfigs[currentEnv]
// const knex = Knex(knexConfig);

describe("user.route.js", () => {
  let knex
  beforeAll(async () => {
    // knex = Knex(knexConfig);
    knex = pool
    // Model.knex(knex) // not needed for tests to pass, not using objection here...
    // await knex.migrate.rollback();
    // await knex.migrate.latest(); // done in global setup
    // await knex.raw('TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;')
    // await knex.raw('TRUNCATE TABLE "Project" RESTART IDENTITY CASCADE;')
    // await knex.seed.run(); // TODO: if kept here, can't destroy data in any tests that other tests rely on
  });
  beforeEach(async () => {
    // await knex.migrate.rollback();
    // await knex.migrate.latest();
    // await knex.seed.run();
  });
  // TODO: this isnt needed b/c globalTeardown
  // afterAll(async () => {
  //   await knex.destroy()
  // })
  describe("GET /users", () => {
    test("It should return a list of users", async () => {
      const { body: users } = await request(app).get(`${apiUrl}/users`).expect(200);

      expect(filterDynamic(users)).toMatchSnapshot();
    });
  });
  describe("GET /users/:id", () => {
    test("It should return a user filtered by acl", async () => {
      const dbUsers = await knex('User');
      const { id } = dbUsers[0]
      const { body: user } = await request(app).get(`${apiUrl}/users/${id}`).expect(200);
      const filteredSerialized = filterDynamic(user)
      expect(filteredSerialized).not.toHaveProperty('password')
      expect(filteredSerialized).toMatchSnapshot();
    });
    test("It should return a user for the current user", async () => {
      const seedUsers = await knex('User');
      const seedUser = seedUsers[0]
      const { id } = seedUser
      const token = generateJWT(seedUser)
      const { body: user } = await request(app)
        .get(`${apiUrl}/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const filteredSerialized = filterDynamic(user)
      expect(filteredSerialized).toHaveProperty('password')
      expect(filteredSerialized).toMatchSnapshot();
    });
  });
  describe("GET /users/:id/projects", () => {
    test("It should return a list of projects for the owner", async () => {
      const seedUsers = await knex('User');
      const seedUser = seedUsers[0]
      const { id } = seedUser
      const token = generateJWT(seedUser)
      const { body: projects } = await request(app)
        .get(`${apiUrl}/users/${id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(projects).toMatchSnapshot();
    });
    test("It should return 403 for unauthorized user", async () => {
      const seedUsers = await knex('User');
      const owner = seedUsers[0]
      const { id: ownerId } = owner
      const nonOwner = seedUsers[1]
      const nonOwnerToken = generateJWT(nonOwner)
      await request(app)
        .get(`${apiUrl}/users/${ownerId}/projects`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .expect(403);
    });
    test("It should return 401 for unauthenticated user", async () => {
      const seedUsers = await knex('User');
      const owner = seedUsers[0]
      const { id: ownerId } = owner
      await request(app)
        .get(`${apiUrl}/users/${ownerId}/projects`)
        .expect(401);
    });
  });
});