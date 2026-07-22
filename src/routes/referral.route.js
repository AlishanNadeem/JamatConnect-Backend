import express from 'express'
import { getMyReferredUsers } from '../controllers/referral.controller.js'
import { AuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.get('/referred-users', AuthVerifier, RestrictAccess([ROLES.USER]), getMyReferredUsers)

export default router
