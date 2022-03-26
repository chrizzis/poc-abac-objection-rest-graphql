# express-objection-apollo-graphql

**Cloned from tempate:**
- express-jest-supertest
    - express-pg-knex-objection-jwt



## Features
- `jest, supertest` - integration/unit tests
- `pg, knex, objection` - ORM for postgreSQL db integration for REST API
- `jsonwebtoken` - authN/authZ using JWT token and RBAC/ABAC
- `apollo, graphql, objection-graphql` - graphql API integration with Objection ABAC
- DEFER: `apollo, graphql, datasource-sql` - graphql API (datasource-sql uses `knex`)

## TODOS:
- remove unused packages
- An app demonstrating graphql integration with a REST API with ABAC using objection (vs `datasource-sql`)