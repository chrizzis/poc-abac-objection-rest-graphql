# poc-abac-objection-rest-graphql

A demo app showing GraphQL integration with a REST API with ABAC using Objection (vs `datasource-sql`)

## Features
- `jest, supertest` - integration/unit tests
- `pg, knex, objection` - ORM for postgreSQL db integration for REST API
- `jsonwebtoken` - authN/authZ using JWT token and RBAC/ABAC
- `apollo, graphql, objection-graphql` - graphql API integration with Objection ABAC

## Proof of concept tasks demonstrating existing REST ABAC behavior with GraphQL:
- [x] All-or-nothing authorization
- [x] Filtering entities in a collection/graph to authorized content
- [x] Filtering fields on entities in a collection/graph to permissible fields
- [ ] Not having to explicitly add fields in a GraphQL query necessary for fetching related resources
- [ ] Authorization middleware and integration tests

## Getting Started

### Local Development/Testing

1. Set up a local PostgreSQL database referenced by `POSTGRES_TEST_DB` in `.env.example`
1. In `.env.example`, set the following variables:
    - `POSTGRES_LOCAL_CONNECTION_URL`
    - `DEV_DB_URL`
    - `TEST_DB_URL`
1. Clone this repository
1. `yarn` to install dependencies
1. `yarn k:latest` - to perform migrations
1. `yarn k:srun` - to seed the database
- Testing:
  - `yarn test`
- Serving locally:
  - `yarn start`
  - Recipes (curl):
    - Anonymous requests:
      - REST
        - get a list of users: `curl http://localhost:3000/api/v0/users`
        - get a list of projects:  `curl http://localhost:3000/api/v0/projects`
        - get a list of projects for a user:  `curl http://localhost:3000/api/v0/users/1/projects`
      - GraphQL: `TODO: auth middleware and integration api tests`
    - Get token and send with requests:
      - REST: TODO
      - GraphQL: TODO
- Developing:
  - `yarn dev`

## TODO:
- graphql nested queries need to explicitly specify fields used in relation mapping
- write checklist of integration tasks complete