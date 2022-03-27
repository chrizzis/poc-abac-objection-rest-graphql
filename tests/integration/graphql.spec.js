import { graphql } from 'graphql'
import createSchema from '../../src/schema.js'
import pool from '../../src/db.js'
import { Model } from 'objection'
import acl from '../../src/access-control/acl.js'

// TODO: something in graphql implementation is causing jest to process.exit with 1 after successful testing
// TODO: some async thing? server.close()
describe('User Access Control', () => {
  let rootNodeForUser = null;
  let runQueryAsUser = null;
  let knex
  let schema
  beforeAll(async () => {
    knex = pool
    Model.knex(pool)
    schema = await createSchema(pool)
  })
  beforeEach(async () => {
    // TODO: this should be an auth middleware for graphql route
    rootNodeForUser = async (username) => {
      let user
      if (username) {
        user = await knex('User').select('id', 'role').where({ username }).first();
      }
      if (!user) {
        user = { role: 'anonymous' }
      }
      const context = { _user: user, _isGraphqlQuery: true, _ability: acl(user) }
      return {
        async onQuery(qb) {
          return qb.context(context);
        },
      };
    };
    runQueryAsUser = async (username, query) => {
      const rootNode = await rootNodeForUser(username);
      return graphql({ schema, source: query, rootValue: rootNode });
    };
  });
  it('should have our 3 users in the db', async () => {
    const users = await knex('User').select('username', 'password');
    expect(users).toMatchSnapshot();
  });
  it('should not be able to see passwords with an anonymous user', async () => {
    const query = '{users { id, username, password }}'
    const result = await runQueryAsUser(null, query);
    expect(result).toMatchSnapshot();
  });
  it('should not be able to see the passwords of others with a registered user', async () => {
    const result = await runQueryAsUser('alice-immutable', '{users { id, username, password }}');
    expect(result).toMatchSnapshot();
  });
  it('should not be able to see unpublished projects with an anonymous user', async () => {
    const result = await runQueryAsUser(null, '{projects { id, published, ownerOnly }}');
    expect(result).toMatchSnapshot();
  });
  it('should not be able to see unpublished projects of others with a registered user', async () => {
    // TODO: had to add ownerId for graphql ABAC plugin to use for acl
    // TODO: i shouldn't have to explicitly request fields just to get the relations -- need to figure out how to fix this...
    const result = await runQueryAsUser('alice-immutable', '{projects { id, published, ownerId, ownerOnly }}');
    expect(result).toMatchSnapshot();
  });
  it('should not be able to see user passwords, nor unpublished projects with an anonymous user', async () => {
    const query = `{
      users {
        id,
        username,
        password,
        projects {
          title,
          ownerId,
          published,
          ownerOnly
        }
      }
    }`
    const result = await runQueryAsUser(null, query);
    expect(result).toMatchSnapshot();
  });
  it('should not be able to tunnel through graph to see unauthorized data with an anonymous user', async () => {
    const query = `{
      users {
        id,
        username,
        password,
        projects {
          title,
          ownerId,
          published,
          ownerOnly,
          owner {
            id,
            username,
            password,
          }
        }
      }
    }`
    const result = await runQueryAsUser(null, query);
    expect(result).toMatchSnapshot();
  });
})