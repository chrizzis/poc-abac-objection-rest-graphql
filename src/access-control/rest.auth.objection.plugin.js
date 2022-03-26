import Role from "./role.js"
import interpret from './interpret.js'
import acl from './acl.js'
// NOTE: workaround for jest/casl esm support failing in this case
const pkg = await import('@casl/ability/extra')
// https://stackoverflow.com/questions/43814830/destructuring-a-default-export-object
// const { default: { rulesToQuery } } = await import('@casl/ability/extra'); // NOTE: this solution only works for tests
const { rulesToQuery, permittedFieldsOf } = pkg.default || pkg

// TODO: this should be pulled into a module that encapsulates acl/casl specific behavior to be used by rest/graphql
function getPermittedFields(ability, entity, fields) {
  return permittedFieldsOf(ability, 'read', entity, {
    fieldsFrom: rule => rule.fields || fields
  })
}

function permissibleEntity(entity, permitted) {
  return Object.keys(entity)
    .filter(key => permitted.includes(key))
    .reduce((obj, key) => {
      obj[key] = entity[key];
      return obj;
    }, {});
}

// for now, only one level deep
function permissibleTree(ability, root, relationName) {
  // TODO: with one param, this can be retrieved from external context
  // const ability = acl(user)

  // assumption #4
  const fields = Object.keys(root)
  // const permittedFields = permittedFieldsOf(ability, 'read', root, {
  //   fieldsFrom: rule => rule.fields || fields
  // })
  const permittedFields = getPermittedFields(ability, root, fields)
  const permissibleRoot = permissibleEntity(root, permittedFields)

  let children = root[relationName]
  if (children?.length) {
    // assumption #4
    const childFields = Object.keys(children[0])
    if (childFields) {
      children = children.map(c => {
        const childPermittedFields = getPermittedFields(ability, c, childFields)
        return permissibleEntity(c, childPermittedFields)
      })
    }
    return { ...permissibleRoot, [relationName]: children }
  }
  return permissibleRoot
}

export default Model => {
  class RestAuthQueryBuilder extends Model.QueryBuilder {
    // this method filters a list of results to accessible content (by modifying query.where)
    // to provide all or nothing access, use authUser
    // to filter an entity to permissible fields, use authorizeRead
    accessibleBy(user, reqConditions = {}) {
      console.debug(`accessibleBy:${JSON.stringify(user)}`)
      console.error(`TODO: enable requested reqConditions (shared endpoint will set by default) merge with accessible reqConditions:${JSON.stringify(reqConditions)}`)

      const ability = acl(user)
      const convert = rule => rule.inverted ? { $not: rule.conditions } : rule.conditions
      const subjectType = this.modelClass().name
      console.error(`TODO: get subjectType from model: ${subjectType}`)

      const aclConditions = rulesToQuery(ability, 'read', subjectType, convert) || {};

      this.context({
        _accessibleBy: true,
        _user: user,
      })
      return this.whereChain(reqConditions, aclConditions)
    }
    // this method provides all or nothing access
    // to filter a list of results to accessible content, use accessibleBy
    // to filter an entity to permissible fields, use authorizeRead
    authUser(currentUser) {
      return this.context({
        _authUser: true,
        _user: currentUser,
        _ability: acl(currentUser),
        // _class: this.modelClass(),
      })
    }
    // TODO: current behavior (authorizeRead) is to prune unauthed fields from a model instance, but since it is async, cant be used with withGraphFetched.modifiers
    // withGraphFetched.selectAccessible FOR NOW is going to have to wait until last call to afterFind ({result: [User.Project], i:[],r:undefined})
    //  then drill into the nodes in the graph to authorizeRead (yuck - what if the graph is huge?!)
    selectAccessible(currentUser) {
      // const ability = acl(currentUser)
      const resource = this.modelClass().name
      // TODO: resource must be a hydrated object
      // const permitted = permittedFieldsOf(ability, 'read', resource, {
      //   fieldsFrom: rule => rule.fields
      // })
      // TODO: build select array from permitted
      // this.select(permitted)
      return this.context({
        _selectAccessible: true,
        _user: currentUser,
        _ability: acl(currentUser),
        // _class: this.modelClass(),
      })
    }
    whereChain(reqConditions, aclConditions) {
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
        _whereChain: true,
      })
      return this
    }
  }

  return class extends Model {
    static get QueryBuilder() {
      return RestAuthQueryBuilder
    }
    /**
     * static hooks only run once per query.
     * complex case where this is insufficient: published project can have premium content
     *  anonymous users can see the 'free' project, while gated users can also see the premium content
     * @param {StaticHookArguments} args 
     */
    static async afterFind(args) {
      await super.afterFind(args)
      // User.query().withGraphFetched('projects'): result = [Project], items = [User]
      const { result, items, inputItems, relation, context: queryContext } = args
      if (queryContext._authUser) {
        if (queryContext._accessibleBy) {
          // authUser overrides accessibleBy - if one entity in a collection is not accessible, authUser will 401/403, while accessibleBy filters the list (whereChain)
          const todoError = `auth.objection.plugin.afterFind: accessibleBy.authUser use detected! use either/or`
          console.error(todoError)
          throw new Error(todoError)
        }
        const { _ability: ability, _user: user } = queryContext
        let resource = result || items
        // const ability = acl(queryContext._user)
        if (Array.isArray(resource)) { // Objection result and items are always arrays, even if findOne
          // TODO: authUser is all or nothing
          // TODO: i could auth the list, but why would i want to throw if one item in the list isnt authed
          // TODO: instead, use accessibleBy to filter the list to acl
          resource = resource[0]
        }
        if (ability.cannot('read', resource)) {
          const error = new Error()
          if (user.role === Role.Anonymous) {
            error.status = 401
            error.message = 'authN'
          } else {
            error.status = 403
            error.message = 'authZ'
          }
          throw error
        }
        // this runs afterFind on each query/subquery (withGraphFetched('projects') runs twice)
        // after implementing graphql, see if runAfter can be used here too to prevent this wonky 'wait till last afterFind' behavior
      } else if (queryContext._selectAccessible) {
        const { _ability: ability, _user: user } = queryContext
        // for now i am making some big assumptions: ex: User.query().withGraphFetched('projects(mod)').modifiers({mod(b){b.selectAccessible(user)}})
        // 1. selectAccessible only withGraphFetched, otherwise authorizeRead
        // 2. withGraphFetched runs afterFind for each query (following example: 1.projects,2.users)
        // 3. wait until last afterFind to transform data (prune to authorized fields) - identified as r:[u.p], i:[], r: undefined
        // 4. all models in a list have the same fields (only need to get them once)
        const relationName = relation?.name
        // TODO: transformations in nested afterFind get lost - this does nothing
        if (relationName) {
          return
        }
        const relations = Object.keys(this.relationMappings || {})
        // TODO: Objection docs show if there are multiple relations requested, it would be withGraphFetched(children.[projects, other, ...])
        if (relations.length > 1) {
          console.error(`multiple relations detected - here be dragons!`)
        }
        const simpleRelation = relations[0]
        const permissibleResources = result.map(i => {
          return permissibleTree(ability, i, simpleRelation)
        })
        return permissibleResources
      }
    }
    // static async beforeFind(args) {
    //   await super.beforeFind(args)
    //   const { asFindQuery, items, inputItems, relation, context: queryContext } = args
    //   // TODO: to enable, add context in RestAuthQueryBuilder.accessibleBy
    //   // console.info(`accessibleBy.beforeFind context: ${queryContext.ability.rules}`)
    // }

    authorizeRead(user) {
      console.debug(`authorizeRead - user: ${user}`)
      const resource = this
      const ability = acl(user)
      const fields = Object.keys(resource) // TODO: deep
      const permitted = permittedFieldsOf(ability, 'read', resource, {
        fieldsFrom: rule => rule.fields || fields
      })
      if (fields.legth === permitted.length) {
        return resource
      }
      return permissibleEntity(resource, permitted)
    }
  }
}