import { graphql } from 'graphql'
import createSchema from '../../src/schema.js'
import pool from '../../src/db.js'
import { Model } from 'objection'
import acl from '../../src/access-control/acl.js'

// TODO: something in my graphql implementation is causing yarn test:once to process.exit with 1 after successful testing
// TODO: some async thing? server.close()
// afterFind console.log error: Cannot log after tests are done. Did you forget to wait for something async in your test?
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
      // const context = { userId: user.id, isApiQuery: true };
      const context = { _user: user, _isGraphqlQuery: true, _ability: acl(user) } // i think ill have to roll a new fn _graphqlAuth: {authUser, accessibleBy, selectAccessible, whereChain}
      return {
        // TODO: implement this (qb = queryBuilder (AuthQueryBuilder))
        // builder is an objection.js query builder.
        async onQuery(qb) {
          // TODO: objection-graphql uses old-ass versions of objection and graphql.
          // i need to override builder.eager - first i need to trace where it is coming from...
          // qb.eagerAlgorithm(Model.JoinEagerAlgorithm);
          return qb.context(context);
        },
      };
    };
    runQueryAsUser = async (username, query) => {
      const rootNode = await rootNodeForUser(username);
      // Expected undefined to be a GraphQL schema.
      // return graphql(schema, query, rootNode);
      return graphql({ schema, source: query, rootValue: rootNode });
      // return graphql({ schema, source: query });
    };
  });
  it('should have our 3 users in the db', async () => {
    const users = await knex('User').select('username', 'password');
    expect(users).toMatchSnapshot();
  });
  // too simple, deprecate after auth middleware added - entire graphql api should be authed
  it('should not be able to see passwords with an anonymous user', async () => {
    const query = '{users { id, username, password }}'
    // const { data: { users } } = await graphql({ schema, source: query })
    // const { data: { users } } = await runQueryAsUser(null, '{users { id, username, password }}');
    // expect(users).toMatchSnapshot();
    const result = await runQueryAsUser(null, query);
    expect(result).toMatchSnapshot();
  });
  it('should not be able to see the passwords of others with a registered user', async () => {
    // const { data: { users } } = await runQueryAsUser('alice-immutable', '{users { id, username, password }}');
    // expect(users).toMatchSnapshot();
    const result = await runQueryAsUser('alice-immutable', '{users { id, username, password }}');
    expect(result).toMatchSnapshot();
  });
  it('should not be able to see unpublished projects with an anonymous user', async () => {
    // const { data: { projects } } = await runQueryAsUser('alice-immutable', '{projects { id, published, onlyOwner, ownerOnly }}');
    const result = await runQueryAsUser(null, '{projects { id, published, ownerOnly }}');
    expect(result).toMatchSnapshot();
  });
  it('should not be able to see unpublished projects of others with a registered user', async () => {
    // const { data: { projects } } = await runQueryAsUser('alice-immutable', '{projects { id, published, onlyOwner, ownerOnly }}');
    // TODO: had to add ownerId for graphql ABAC plugin to use for acl (how the fuck do i make objection do this on insert?)
    // TODO: i shouldn't have to explicitly request fields just to get the relations -- need to figure out how to fix this...
    const result = await runQueryAsUser('alice-immutable', '{projects { id, published, ownerId, ownerOnly }}');
    // const result = await runQueryAsUser('alice-immutable', '{projects { id, published, ownerId, ownerOnly }}');
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