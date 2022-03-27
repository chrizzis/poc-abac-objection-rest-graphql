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

const generateJWT = (payload, quick = false) => {
  let options
  if (payload) {
    if (payload.exp) { // refresh token
      const { expiresIn, subject, ...filteredOptions } = defaultOptions
      options = filteredOptions
    } else { // user token
      const { subject, ...filteredOptions } = defaultOptions
      options = {
        ...filteredOptions,
        subject: payload.id.toString(),
      }
      if (quick) {
        options.expiresIn = '10s'
      }
    }
  }
  return jwt.sign(payload, PRIVATE_KEY, options)
}

const verifyJWT = (payload) => {
  const { subject, ...filteredOptions } = defaultOptions
  return jwt.verify(payload, PUBLIC_KEY, filteredOptions)
}

export {
  generateJWT,
  verifyJWT,
}