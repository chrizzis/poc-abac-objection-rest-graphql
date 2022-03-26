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
    // DEMO-PROVEN: prune a list: accessibleBy - needs to modify query (modifyApiQuery - whereChain)
    // all or nothing: authUser - needs [result,items] model instance, but throws (or does nothing)
    // filter fields from a graph: selectAccessible - needs result model instances, bit maps - cant map here...
    constructor(modelClass) {
      super(modelClass);
      // this runs for every model, i think need it to run once for a group of models
      this.runBefore(async (result, qb) => {
        const context = qb.context();
        if (!context._isGraphqlQuery) return;
        await modelClass.modifyApiQuery(qb, context);
      });
      // this.runAfter(async (result, qb) => {
      this.runAfter((result, qb) => {
        const context = qb.context();
        if (!context._isGraphqlQuery) return result;
        // if (!context._isGraphqlQuery) return;
        const queryContext = {
          ...context,
          _selectAccessible: true
        }
        return modelClass.modifyApiResults(result, context, qb);
      });
    }

    // NOTE: override DEPRECATED objection-graphql:objection.eager fn
    eager(expression, filters) {
      const chain = expression.split('.')
      const relationPart = chain[chain.length - 1]
      // const relationRegex = /(?<=\[)(.*?)(?=\())/
      const relationRegex = /\[(.*?)\(/
      // const relation = relationPart.match(relationRegex)[1]
      const relation = chain.map(rp => {
        return rp.match(relationRegex)[1]
      }).join('.')

      // const relationChain = expression.replace('[')

      if (!relation) {
        console.error(`ERROR retrieving relation`)
      }


      // args: SchemaBuilder:293 - eager: { expression = '[projects(s2)]', filters }
      // this = SchemaBuilder
      console.log(`graphql.auth.eager override`)
      // return this.withGraphFetched(relation)
      return this.withGraphFetched('projects.owner')
    }

    // NOTE: trying to override DEPRECATED objection-graphql:objection.eager
    eagerDEP(args) {
      // args: SchemaBuilder:293 - eager: { expression = '[projects(s2)]', filters }
      // this = SchemaBuilder
      console.log(`graphql.auth.eager args: ${args}`)
      // GraphQLError: Invalid relation expression "["
      const { expression, filters } = args
      if (expression.includes('projects')) {
        // GraphQLError: Cannot read properties of undefined(reading 'includes')
        return this.withGraphFetched('projects')
      } else {
        return this.withGraphFetched(...args)
      }
      // GraphQLError: could not find modifier "s2" for relation "projects"
      // return this.withGraphFetched(args)
    }

    graphqlWhereChain(reqConditions, aclConditions) {
      const queryFilters = interpret(reqConditions, aclConditions) || []
      queryFilters.forEach(condition => {
        const term = Object.keys(condition)[0]
        const conditionOrSubquery = condition[term]
        // TODO: for now, only supporting one level of subqueries
        if (Array.isArray(conditionOrSubquery)) {
          console.error(`whereChain: subquery found, need to add it!`)
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
     * static hooks only run once per query.
     * complex case where this is insufficient: published project can have premium content
     *  anonymous users can see the 'free' project, while gated users can also see the premium content
     * @param {StaticHookArguments} args 
     */
    static async afterFind(args) {
      await super.afterFind(args)
      // result = relation ? subquery (wgf) : query+subquery, items = relation ? query+subquery : []
      const { result, items, inputItems, relation, context: queryContext } = args
      if (queryContext._isGraphqlQuery) {
        console.log(`graphql.static.afterFind: this is a graphql query`)
      }
    }
    // static async beforeFind(args) {
    //   await super.beforeFind(args)
    //   const { asFindQuery, items, inputItems, relation, context: queryContext } = args
    //   // TODO: to enable, add context in GraphqlAuthQueryBuilder.accessibleBy
    //   // console.info(`accessibleBy.beforeFind context: ${ queryContext.ability.rules } `)
    // }

    // i think this will work like accessibleBy, test on {users {username, password, projects:{title, published, ownerOnly}}}
    static async modifyApiQuery(qb, context) {
      const { _ability: ability, _user: user } = context
      // this = derived model class [i.e. User] available: (this.name, this.tableName, this.relationMappings)
      console.log('modifyApiQuery', { user });

      // if (this.tableName === 'Project') {
      // NOTE: THIS WORKS (accessibleBy), NEED TO MAKE WHERECHAIN A SERVICE THAT GRAPHQL AND REST CAN USE
      const convert = rule => rule.inverted ? { $not: rule.conditions } : rule.conditions
      // const subjectType = this.modelClass().name
      const subjectType = this.name // || this.tableName
      console.error(`TODO: get subjectType from model: ${subjectType} `)
      const aclConditions = rulesToQuery(ability, 'read', subjectType, convert) || {};
      qb.graphqlWhereChain({}, aclConditions)
      // }

      // else {
      //   qb.whereRaw('1=2');
      // }
    }

    // TODO: demo all hooks and modify results to see if there is a hook that plays nice with graphql
    // static async modifyApiResults(result, context, qb) {
    static modifyApiResults(result, context, qb) {
      // result is an  array of model instances. any mapping will destroy class context - ill have to find another hook
      // GraphQLError: result[i].$toJson is not a function
      const { _ability: ability, _user: user } = context

      // NO WORKEY - DOWNSTREAM STILL NEEDS THE CLASS INFO
      // const permissible = result.map(r => {
      //   const { password, ...permissible } = r
      //   return permissible
      // });

      const fields = Object.keys(result[0] || {}) // assume all models have same fields

      // working demo, fucking terrible...
      // TODO: pull in permittedFields shit from rest to pass tests, then decouple
      result.forEach(r => {
        const permittedFields = getPermittedFields(ability, r, fields)
        // lengths can be equal yet permittedFields pruned if entity.withGraphFetched('children')
        // TODO: make sure i dont prune children
        const unauthorizedFields = fields.filter(f => !permittedFields.includes(f))
        unauthorizedFields.forEach(f => {
          delete r[f]
        })
      })

      // qb.context({ _selectAccessible: true })


      // console.log({ result })
      return result
    }
  }
}