// import { Model, ValidationError, snakeCaseMappers } from 'objection';
import objection from 'objection'
import path from 'path'
const __dirname = path.resolve();
import RestAccessible from '../access-control/rest.auth.objection.plugin.js'
import GraphqlAccessible from '../access-control/graphql.auth.objection.plugin.js'
import deprecated from '../access-control/DEPRECATED.auth.js'

// https://github.com/Vincit/objection.js/issues/2023
const { compose, Model, ValidationError, snakeCaseMappers } = objection

// NOTE: ORDER MATTERS (dunno why yet, but rest authed graph test was failing when not first in compose list)
const mixins = compose(GraphqlAccessible, RestAccessible)
// const mixins = compose(GraphqlAccessible)

// https://vincit.github.io/objection.js/guide/plugins.html
// https://stackoverflow.com/questions/63145910/objection-js-extends-multiple-plugins
class Base extends mixins(Model) {
  // Objection Model Configs
  // static get modelPaths() {
  //   console.log(`dirname: ${__dirname}`)
  //   return [__dirname];
  // }
  static get tableName() {
    return this.name;
  }

  // static get columnNameMappers() {
  //   return snakeCaseMappers({ upperCase: false });
  // }

  // https://vincit.github.io/objection.js/recipes/custom-validation.html#examples
  // $beforeInsert() {
  static async beforeInsert({ items, inputItems }) {
    const input = inputItems[0]
    console.debug(`base.model beforeInsert`)
    console.debug(`items: ${JSON.stringify(items)}`)
    console.debug(`inputItems: ${JSON.stringify(inputItems)}`)
    // input.createdon = Math.floor((+ new Date()) / 1000)
    // input.createdon = new Date().toISOString()
    // TODO: do not transform in model layer: https://github.com/Vincit/objection.js/issues/1145
    // input.password = hashPassword(input.password)

    // TODO: this makes testing harder as we dont have refs to ids...
    // TODO: maybe validate using acl?
    // if (input.id) {
    //   // TODO: id never comes from route, so this never fires - enable test for this case once validation moved from ctrl.
    //   throw new ValidationError({
    //     message: 'identifier should not be defined before insert',
    //     type: 'MyCustomError',
    //     // data: someObjectWithSomeData
    //   });
    // }
  }

  // TODO: do not transform in model layer: https://github.com/Vincit/objection.js/issues/1145
  // TODO: args are populated when query has been explicitly started for a set of model instances
  // TODO: i.e. Person.$query() works, but Person.query() doesn't
  // static async beforeFind(args) {
  //   console.error(`user.model beforeFind items: ${JSON.stringify(args)}`)
  //   // items.password = hashPassword(items.password)
  // }

  // static async beforeUpdate() {
  //   this.password = hashPassword(this.password)
  // }

  // TODO: soft delete
  // static async beforeDelete({ asFindQuery, cancelQuery }) {
  //   // Even though `asFindQuery` returns a `select` query by default, you
  //   // can turn it into an update, insert, delete or whatever you want.
  //   const [numAffectedItems] = await asFindQuery().patch({ deleted: true });

  //   // Cancel the query being executed with `numAffectedItems`
  //   // as the return value. No need to `await` this one.
  //   cancelQuery(numAffectedItems);
  // }
}

export default Base;