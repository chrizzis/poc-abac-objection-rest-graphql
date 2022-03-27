import { defineAbility } from '@casl/ability'
import Role from './role.js'

/**
 * Rules for authorizing a user on a resource.
 * 
 * @param user
 */
function acl(user) {

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
  })
}

export default acl
