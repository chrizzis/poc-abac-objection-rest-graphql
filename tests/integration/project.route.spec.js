import request from 'supertest'
import app from '../../src/app.js'
import { apiUrl } from '../../config/index.js'
import pool from '../../src/db.js'
import { generateJWT } from '../../src/utils/jwt.js'

describe("project.route.js", () => {
  let knex
  beforeAll(async () => {
    knex = pool
  });
  describe("GET /projects", () => {
    test("It should return a list of projects filtered by acl for anonymous user", async () => {
      const { body: projects } = await request(app).get(`${apiUrl}/projects`).expect(200);
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