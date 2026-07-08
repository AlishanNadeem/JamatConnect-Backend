import express from 'express'
import { addFeedback } from '../controllers/feedback.controller.js'
import { CREATE_FEEDBACK_VALIDATOR } from '../helpers/validators.js'
import { OptionalAuthVerifier } from '../middleware/auth.middleware.js'
import validator from '../middleware/validator.js'

const router = express.Router()

router.post('/create', OptionalAuthVerifier, validator(CREATE_FEEDBACK_VALIDATOR), addFeedback)

export default router