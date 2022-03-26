import request from 'supertest'
import app from '../../src/app.js'

describe("app.js", () => {
  let server
  beforeAll(async () => {
  })
  describe("Index route", () => {
    test("It should return status 200", async () => {
      const response = await request(app).get(`/`);
      expect(response.statusCode).toBe(200);
    });
    test("should return the static site from the index route", async () => {
      const response = await request(app).get(`/`);

      expect(response.type).toEqual("text/html");
      expect(response.text).toMatchSnapshot()
    });

    test("should return status 404 for undefined route", async () => {
      const response = await request(app).get("/nonexistentroute").expect(404);
    });
  });
});