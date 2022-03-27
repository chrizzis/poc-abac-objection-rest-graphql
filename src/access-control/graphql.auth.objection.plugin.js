import interpret from './interpret.js'
// NOTE: workaround for jest/casl esm support failing in this case
const pkg = await import('@casl/ability/extra')
// https://stackoverflow.com/questions/43814830/destructuring-a-default-export-object
// const { default: { rulesToQuery } } = await import('@casl/ability/extra'); // NOTE: this solution only works for tests
const { rulesToQuery, permittedFieldsOf } = pkg.default || pkg

function getPermittedFields(ability, entity, fields) {
  return permittedFieldsOf(ability, 'read', entity, {
    fieldsFrom: rule => rule.fields || fields
  })
}
// TODO: chase jest exit error: error Command failed with exit code 1.
// afterFind console.log error: Cannot log after tests are done. Did you forget to wait for something async in your test?
export default Model => {
  class GraphqlAuthQueryBuilder extends Model.QueryBuilder {
    constructor(modelClass) {
      super(modelClass);
      // if this is a graphql query -> auth user to accessible entities
      this.runBefore(async (result, qb) => {
        const context = qb.context();
        if (!context._isGraphqlQuery) return;
        // TODO: optimize (getting hit for every resource in a list)
        await modelClass.modifyApiQuery(qb, context);
      });
      // if this is a graphql query -> auth user to permissible fields in entites
      this.runAfter((result, qb) => {
        const context = qb.context();
        if (!context._isGraphqlQuery) return result;
        return modelClass.modifyApiResults(result, context, qb);
      });
    }

    // NOTE: override DEPRECATED objection-graphql:objection.eager fn
    eager(expression, filters) {
      const chain = expression.split('.')
      const relationRegex = /\[(.*?)\(/
      const relation = chain.map(rp => {
        return rp.match(relationRegex)[1]
      }).join('.')

      if (!relation) {
        console.error(`ERROR retrieving relation`)
      }
      return this.withGraphFetched(relation)
    }

    graphqlWhereChain(reqConditions, aclConditions) {
      const queryFilters = interpret(reqConditions, aclConditions) || []
      queryFilters.forEach(condition => {
        const term = Object.keys(condition)[0]
        const conditionOrSubquery = condition[term]
        // TODO: for now, only supporting one level of subqueries
        if (Array.isArray(conditionOrSubquery)) {
          this[term](function () {
            conditionOrSubquery.forEach(c => {
              const subqueryTerm = Object.keys(c)[0]
              this[subqueryTerm](c[subqueryTerm])
            }, this)
          })
        } else {
          this[term](conditionOrSubquery)
        }
      }, this)

      this.context({
        _queryFilters: queryFilters,
        _reqConditions: reqConditions,
        _graqhqlWhereChain: true,
      })
      return this
    }
  }

  return class extends Model {
    static get QueryBuilder() {
      return GraphqlAuthQueryBuilder
    }

    /**
     * Auth user to accessible entities
     * 
     * @param {*} qb QueryBuilder instance
     * @param {*} context context added in middleware
     */
    static async modifyApiQuery(qb, context) {
      const { _ability: ability, _user: user } = context

      const convert = rule => rule.inverted ? { $not: rule.conditions } : rule.conditions
      const subjectType = this.name // || this.tableName
      const aclConditions = rulesToQuery(ability, 'read', subjectType, convert) || {};
      qb.graphqlWhereChain({}, aclConditions)
    }

    /**
     * Auth user to permissible entity fields
     * @param {*} result query/subquery results wrapped in Objection model classes
     * @param {*} context context added in middleware
     * @param {*} qb QueryBuilder instance
     * @returns 
     */
    static modifyApiResults(result, context, qb) {
      const { _ability: ability, _user: user } = context

      const fields = Object.keys(result[0] || {}) // assume all models have same fields

      result.forEach(r => {
        const permittedFields = getPermittedFields(ability, r, fields)
        const unauthorizedFields = fields.filter(f => !permittedFields.includes(f))
        unauthorizedFields.forEach(f => {
          delete r[f]
        })
      })
      return result
    }
  }
}