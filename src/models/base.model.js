// import { Model, ValidationError, snakeCaseMappers } from 'objection';
import objection from 'objection'
import path from 'path'
const __dirname = path.resolve();
import RestAccessible from '../access-control/rest.auth.objection.plugin.js'
import GraphqlAccessible from '../access-control/graphql.auth.objection.plugin.js'

// https://github.com/Vincit/objection.js/issues/2023
const { compose, Model, ValidationError, snakeCaseMappers } = objection

// NOTE: ORDER MATTERS (may be an async issue with the graphql plugin?)
const mixins = compose(GraphqlAccessible, RestAccessible)

// https://vincit.github.io/objection.js/guide/plugins.html
// https://stackoverflow.com/questions/63145910/objection-js-extends-multiple-plugins
class Base extends mixins(Model) {
  static get tableName() {
    return this.name;
  }
}

export default Base;