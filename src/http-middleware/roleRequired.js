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
// const roleRequired = (roles = []) => {
function roleRequired(roles = []) {
  console.debug(`middleware.roleRequired.before: ${roles}`)
  // return (req, res, next) => {
  return function (req, res, next) {
    // async (req, res, next) => {
    console.debug(`middleware.roleRequired: ${roles}`)
    const { user } = req

    const error = new Error('authN')
    error.status = 401
    if (!user?.role) {
      console.debug(`roleRequired: user not set (attachCurrentUser should resolve this) - should throw 401 (unauthenticated)`)
      // return next(new UnauthorizedError('credentials_required', { message: `Invalid credentials.` }))
      return next(error)
    }
    if (user.role === Role.Anonymous) {
      console.debug(`roleRequired: requires authenticated role - should throw 401 (unauthenticated)`)
      // return next(new UnauthorizedError('credentials_required', { message: `Invalid credentials.` }))
      return next(error)
    }

    error.status = 403
    error.message = 'authZ'
    // TODO: the following shoud throw 403 (b/c the user is authenticated, but forbidden)
    if (!roles.includes(user.role)) {
      // Role.Owner is derived from user.role and req.params.userId
      if (roles.includes(Role.Owner)) {
        const { id } = req.user; // attachCurrentUser
        const { userId } = req.params
        if (!userId || !id) {
          console.debug(`roleRequired: missing user and/or owner id`)
          // return next(new AuthError('Insufficient user info'))
          return next(error)
        }
        if (+id !== +userId) {
          console.debug(`roleRequired: user not owner`)
          // return next(new AuthError('Insufficient privileges'))
          return next(error)
        }
      } else {
        console.debug(`roleRequired: user role not allowed`)
        // return next(new AuthError('Insufficient privileges'))
        return next(error)
      }
    }
    return next()
  }
}
export default roleRequired