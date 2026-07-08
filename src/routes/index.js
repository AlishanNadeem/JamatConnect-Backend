import express from "express";

const router = express.Router()

import auth_routes from './authentication.route.js'
import user_routes from './user.route.js'
import general_routes from './general.route.js'
import feedback_routes from './feedback.route.js'

router.use('/auth', auth_routes)
router.use('/user', user_routes)
router.use('/general', general_routes)
router.use('/feedback', feedback_routes)

export default router
