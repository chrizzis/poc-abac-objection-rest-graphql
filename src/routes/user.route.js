import { Router } from 'express'
import Role from '../access-control/role.js'
import roleRequired from '../http-middleware/roleRequired.js'
import { User, Project } from '../models/index.js'

const router = new Router();

router.get(`/users`, async (req, res, next) => {
  try {
    const users = await User.query()
    const serializedUsers = users.map(user => user.authorizeRead(req.user))
    return res.json(serializedUsers);
  } catch (e) {
    res.status(e.status || 401)
    res.json({ error: e.message || 'generic message' });
  }

})

router.get(`/users/:id`, async (req, res, next) => {
  try {
    const user = await User.query().findById(req.params.id)
    const serializedUser = user.authorizeRead(req.user)
    return res.json(serializedUser);
  } catch (e) {
    res.status(e.status || 401)
    res.json({ error: e.message || 'generic message' });
  }

})

router.get(`/users/:userId/projects`, roleRequired([Role.Owner, Role.Admin]),
  async (req, res, next) => {
    try {
      const projects = await Project.query().where({ ownerId: req.params.userId })
      const serialized = projects.map(p => p.authorizeRead(req.user))
      return res.json(serialized);
    } catch (e) {
      res.status(e.status || 401)
      res.json({ error: e.message || 'generic message' });
    }
  })

export default router