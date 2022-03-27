import { Router } from 'express'
import { User } from '../models/index.js'
import { generateJWT } from '../utils/jwt.js'

const router = new Router()

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body
  try {
    let isMatch = false;
    const user = await User.query().findOne({ username })
    if (user) {
      isMatch = (password === user.password)
    }

    if (!isMatch) {
      throw new Error('hmmm')
    }

    const token = generateJWT(user.toJSON())
    // get token for user
    res.json({ user, token })
  } catch (e) {
    res.status(401)
    res.json({ error: e.message || 'generic message' });
  }
})

export default router