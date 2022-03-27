import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import http from 'http';
// import withAuth from './http-middleware/withAuth';
import createSchema from './schema.js'
import { env } from '../config/index.js'

const { APOLLO_ENGINE_KEY } = process.env;

const isDev = env.development;

// TODO: im using the db to createSchema:Model.knex(db), but it is duped in index.js
const integrateGraphqlServer = async ({ db, app }) => {
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs: createSchema(db),
    introspection: isDev,
    playground: isDev,
    cors: false,
    bodyParserConfig: false,
    engine: {
      apiKey: APOLLO_ENGINE_KEY,
    },
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start()

  server.applyMiddleware({ app });

  return { server, app, httpServer };;
};

export default integrateGraphqlServer;
