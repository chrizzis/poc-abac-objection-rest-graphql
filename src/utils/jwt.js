import jwt from 'jsonwebtoken'
// import dotenv from 'dotenv'
const { PUBLIC_KEY, PRIVATE_KEY } = process.env

const iss = 'jwt-node' // server?
const sub = 'jwt-node' // user.id
const aud = 'jwt-node' // client?

const defaultOptions = {
  issuer: iss,
  subject: sub,
  audience: aud,
  // expiresIn: '24h',
  expiresIn: '30s',
  algorithm: 'RS256',
}

// function expression vs declaration (function generateJwt...) - protect the class name from being reassigned within the class
// but is not hoisted, so any code that calls a function before it is expressed(?) will throw a ReferenceError
// payload = user: { id, username, roles } OR (refreshToken) { exp, sub }
const generateJWT = (payload, quick = false) => {
  let options
  if (payload) {
    if (payload.exp) { // refresh token
      const { expiresIn, subject, ...filteredOptions } = defaultOptions
      options = filteredOptions
    } else { // user token
      const { subject, ...filteredOptions } = defaultOptions
      console.debug(`generateJwt payload should be user.json: ${JSON.stringify(payload)}`)
      console.debug(`payload.id: ${payload.id.toString()}`)
      options = {
        ...filteredOptions,
        subject: payload.id.toString(),
        // subject: payload.id,
      }
      if (quick) {
        options.expiresIn = '10s'
      }
    }
  }
  return jwt.sign(payload, PRIVATE_KEY, options)
}

// TODO: keep track of request IP address origins to help detect token theft
// TODO: currently this is being used to verify user jwts, not refresh tokens
const verifyJWT = (payload) => {
  const { subject, ...filteredOptions } = defaultOptions
  return jwt.verify(payload, PUBLIC_KEY, filteredOptions)
}

export {
  generateJWT,
  verifyJWT,
}