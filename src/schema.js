import { Model } from 'objection';
import objectionGraphql from 'objection-graphql';
import { User, Project } from './models/index.js'

const createSchema = (db) => {
  // Model.knex(db);

  const builder = objectionGraphql
    .builder()
    .allModels([User, Project])

  return builder.build();
};

export default createSchema;
