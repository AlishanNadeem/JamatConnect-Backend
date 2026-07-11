import express from 'express'
import { createBusiness, deleteBusiness, getBusinessById, getBusinesses, updateBusiness } from '../controllers/business.controller.js'
import { CREATE_BUSINESS_VALIDATOR, UPDATE_BUSINESS_VALIDATOR } from '../helpers/validators.js'
import { AuthVerifier, OptionalAuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import upload from '../middleware/upload.middleware.js'
import validator from '../middleware/validator.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.get('/get', OptionalAuthVerifier, getBusinesses)

router.get('/get/:identifier', OptionalAuthVerifier, getBusinessById)

router.post('/create', AuthVerifier, RestrictAccess([ROLES.USER]), upload('business').fields([{ name: 'logo', maxCount: 1 }, { name: 'image', maxCount: 1 }]), validator(CREATE_BUSINESS_VALIDATOR), createBusiness)

router.patch('/update/:id', AuthVerifier, upload('business').fields([{ name: 'logo', maxCount: 1 }, { name: 'image', maxCount: 1 }]), validator(UPDATE_BUSINESS_VALIDATOR, { optional: true }), updateBusiness)

router.delete('/delete/:id', AuthVerifier, deleteBusiness)

export default router
