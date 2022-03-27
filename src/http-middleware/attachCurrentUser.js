import { verifyJWT } from '../utils/jwt.js'
import Role from '../access-control/role.js'

const defaultUser = {
  role: Role.Anonymous
}

/**
 * Attaches the user requesting the resource to the request object `req.user` in a format expected by the api.
 * If the user is not authenticated, a default is attached.
 * If authenticated, will attach the formatted user decoded from the JWT as the current authenticated user for the request.
 * 
 * @throws {Error} 401/403 if jwt is invalid or expired
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const attachCurrentUser = (req, res, next) => {
  const { authorization } = req.headers
  if (!authorization) {
    req.user = defaultUser
    // https://stackoverflow.com/questions/16810449/when-to-use-next-and-return-next-in-node-js
    return next()
  }
  const headerMatch = authorization.match(/^Bearer\s+?(.+?)\s*$/);
  if (!headerMatch) {
    req.user = defaultUser
    return next()
  }

  const [match, token] = headerMatch;
  let decoded = false;
  try {
    decoded = verifyJWT(token);
  } catch (e) {
    decoded = false;
  }

  if (!decoded) {
    const error = new Error('Invalid credentials')
    error.status = 403
    return next(error)
  }
  const { id, role } = decoded
  req.user = { id, role }

  next()
}

export default attachCurrentUser
