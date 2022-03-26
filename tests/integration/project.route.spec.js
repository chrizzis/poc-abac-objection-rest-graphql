import request from 'supertest'
import app from '../../src/app.js'
import { apiUrl, currentEnv } from '../../config/index.js'
import pool from '../../src/db.js'
import { Model } from 'objection'
import { generateJWT } from '../../src/utils/jwt.js'

// import Knex from 'knex'
// import knexConfigs from '../../knexfile.js'

// const knexConfig = knexConfigs[currentEnv]
// const knex = Knex(knexConfig);

describe("project.route.js", () => {
  let knex
  beforeAll(async () => {
    // knex = Knex(knexConfig);
    knex = pool
    // Model.knex(knex) // not needed for tests to pass, not using objection here...
    // await knex.migrate.rollback();
    // await knex.migrate.latest(); // done in global setup

    // await knex.seed.run(); // TODO: if kept here, can't destroy data in any tests that other tests rely on
  });
  beforeEach(async () => {
    // await knex.seed.run();
  });
  // TODO: this isnt needed b/c globalTeardown
  // afterAll(async () => {
  //   await knex.destroy()
  // })
  describe("GET /projects", () => {
    test("It should return a list of projects filtered by acl for anonymous user", async () => {
      const { body: projects } = await request(app).get(`${apiUrl}/projects`).expect(200);
      // as ac strategies take over, these become obsolete
      // const dbProjects = await knex('Project');
      // expect(projects).toEqual(dbProjects);
      expect(projects).toMatchSnapshot();
    });
    test("It should return a list of projects filtered by acl for registered user", async () => {
      const seedUsers = await knex('User');
      const seedUser = seedUsers[0]
      const token = generateJWT(seedUser)
      const { body: projects } = await request(app)
        .get(`${apiUrl}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(projects).toMatchSnapshot();
    });
  });
  describe("GET /projects/:id", () => {
    test("It should return a project for an authorized (owner) user", async () => {
      const seedUsers = await knex('User');
      const seedUser = seedUsers[0]
      const token = generateJWT(seedUser)
      const dbProjects = await knex('Project');
      const { id } = dbProjects[0]
      const { body: project } = await request(app)
        .get(`${apiUrl}/projects/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(project).toMatchSnapshot();
    });
    test("It should return 401 for an unauthenicated user", async () => {
      const dbProjects = await knex('Project');
      const { id } = dbProjects[0]
      await request(app).get(`${apiUrl}/projects/${id}`).expect(401);
    });
    test("It should return 403 for an unauthorized user", async () => {
      const seedUsers = await knex('User');
      const seedUser = seedUsers[1]
      const token = generateJWT(seedUser)
      const dbProjects = await knex('Project');
      const { id } = dbProjects[0]
      await request(app)
        .get(`${apiUrl}/projects/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});