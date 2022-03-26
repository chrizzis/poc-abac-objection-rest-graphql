import { Model } from 'objection';
import objectionGraphql from 'objection-graphql';
import { User, Project } from './models/index.js'
// import createMutations from './mutations/index.js'

const createSchema = (db) => {
  // Model.knex(db);

  const builder = objectionGraphql
    .builder()
    // .allModels(Object.values(models));
    .allModels([User, Project])

  // createMutations(builder);

  return builder.build();
};

export default createSchema;
