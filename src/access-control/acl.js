import { defineAbility } from '@casl/ability'
import Role from './role.js'

/**
 * Rules for authorizing a user requesting to perform an action on a resource.
 * 
 * @param user
 */
// const acl = (user) => { return (resource, body, relation) => { casl shit with baked in user context }}
// also, since casl is coupled to this, should I pull { rulesToQuery, permittedFieldsOf } in here?
function acl(user, resource, body, relation) {
  if (!!resource && !!body) {
    if (resource.modelProperty !== 'acl-user')
      throw new Error('resource is NOT an instance of User class')
    if (relation === 'projects') {
      if (body.modelProperty !== 'acl-project')
        throw new Error('input is NOT an instance of Pet class')
    } else if (body.modelProperty !== 'acl-user')
      throw new Error('input is NOT an instance of User class')
  }

  return defineAbility((allow, forbid) => {
    allow('read', 'User')
    forbid('read', 'User', ['password'])
    allow('read', 'Project', { published: true })
    forbid('read', 'Project', ['ownerOnly'])

    if (user.role === Role.Anonymous) {
      allow('create', 'User')
      // allow('read', 'Project', { published: true })
    } else if (user.role === Role.User) {
      allow('read', 'User', ['password'], { id: user.id })
      allow('update', 'User', { id: user.id })
      allow('delete', 'User', { id: user.id })
      // allow('read', 'Project', { published: true })
      allow('manage', 'Project', { ownerId: user.id })
    } else if (user.role === Role.Admin) {
      allow('read', 'Project')
      allow('manage', 'Project', { ownerId: user.id })
    }

    // TODO: this is unnecessary as it is defined above
    if (relation === 'projects') {
      // resource = user, body = project
      allow('read', 'Project', { id: user.id })
      allow('create', 'Project', { id: user.id })
    } else if (relation === 'owner') {
      // resource = project, body = user
    }
  })
}

export default acl
