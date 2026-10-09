import express from 'express'
import {
    addFeedback,
    getFeedbackById,
    getFeedbacks,
    toggleFeedbackRead,
} from '../controllers/feedback.controller.js'
import { CREATE_FEEDBACK_VALIDATOR } from '../helpers/validators.js'
import { AuthVerifier, OptionalAuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import validator from '../middleware/validator.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.post('/create', OptionalAuthVerifier, validator(CREATE_FEEDBACK_VALIDATOR), addFeedback)

router.get('/get', AuthVerifier, RestrictAccess([ROLES.ADMIN]), getFeedbacks)

router.get('/get/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), getFeedbackById)

router.patch(
    '/toggle-read/:id',
    AuthVerifier,
    RestrictAccess([ROLES.ADMIN]),
    toggleFeedbackRead
)

export default router
