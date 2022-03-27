import { Router } from 'express'
import { Project } from '../models/index.js'

const router = new Router();

router.get(`/projects`, async (req, res, next) => {
  try {
    const projects = await Project.query().accessibleBy(req.user)
    const serialized = projects.map(p => p.authorizeRead(req.user))
    return res.json(serialized);
  } catch (e) {
    res.status(401)
    res.json({ error: e.message || 'generic message' });
  }

})

router.get(`/projects/:id`, async (req, res, next) => {
  try {
    const project = await Project.query().findById(req.params.id).authUser(req.user)
    return res.json(project.authorizeRead(req.user));
  } catch (e) {
    res.status(e.status)
    res.json({ error: e.message || 'generic message' });
  }

})
export default router