import app from './app.js'
import pool from './db.js'
import integrateGraphqlServer from './graphql-server.js';
import { port } from '../config/index.js'
import { Model } from 'objection';

// TODO: this is duped in schema.createSchema
Model.knex(pool)

// app.listen(port).on('listening', () => {
//   console.log(`app live and listening on port: ${port}`)
// })

const { server, httpServer } = await integrateGraphqlServer({ app })
await new Promise(resolve => httpServer.listen({ port }, resolve));
console.log(`🚀 Graphql server ready at http://localhost:${port}${server.graphqlPath}`);
console.log(`🚀 App ready on port:${port}`);