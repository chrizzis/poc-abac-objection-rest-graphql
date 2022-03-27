import Role from '../access-control/role.js'

/**
 * RBAC with assumptions for authorizing owners of content
 * Assumes req.user is populated and is either an anomyous or authenticated user
 * Ownership is derived from req.user and req.params.userId
 * 
 * If this gets any more complex, I should refactor to use an acl
 * @param {Role[]} roles 
 * @returns 
 */
function roleRequired(roles = []) {
  return function (req, res, next) {
    const { user } = req

    const error = new Error('authN')
    error.status = 401
    if (!user?.role) {
      return next(error)
    }
    if (user.role === Role.Anonymous) {
      return next(error)
    }

    error.status = 403
    error.message = 'authZ'
    if (!roles.includes(user.role)) {
      // Role.Owner is derived from user.role and req.params.userId
      if (roles.includes(Role.Owner)) {
        const { id } = req.user;
        const { userId } = req.params
        if (!userId || !id) {
          return next(error)
        }
        if (+id !== +userId) {
          return next(error)
        }
      } else {
        return next(error)
      }
    }
    return next()
  }
}
export default roleRequired