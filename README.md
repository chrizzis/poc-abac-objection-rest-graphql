# poc-abac-objection-rest-graphql

A demo app showing GraphQL integration with a REST API with ABAC using Objection (vs `datasource-sql`)

## Features
- `jest, supertest` - integration/unit tests
- `pg, knex, objection` - ORM for postgreSQL db integration for REST API
- `jsonwebtoken` - authN/authZ using JWT token and RBAC/ABAC
- `apollo, graphql, objection-graphql` - graphql API integration with Objection ABAC

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
  - cURL commands:
    - REST: `curl http://localhost:3000/api/v0/users`
    - GraphQL: `TODO: auth middleware and integration api tests`
- Developing:
  - `yarn dev`