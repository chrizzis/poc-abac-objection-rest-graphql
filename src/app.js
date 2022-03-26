import express from 'express'
import path from 'path'
import cors from 'cors'
import attachCurrentUser from './http-middleware/attachCurrentUser.js'
import { apiUrl } from '../config/index.js'
import userRoute from './routes/user.route.js'
import projectRoute from './routes/project.route.js'
import authRoute from './routes/auth.route.js'
const __dirname = path.resolve()

const app = express()

app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static(path.join(__dirname, `/public`)))

app.use(authRoute)
app.use(apiUrl, attachCurrentUser)
app.use(apiUrl, userRoute)
app.use(apiUrl, projectRoute)

export default app