import express from 'express'
import { createBusinessCategory, deleteBusinessCategory, getBusinessCategories, getBusinessCategoryById, updateBusinessCategory } from '../controllers/business-category.controller.js'
import { CREATE_BUSINESS_CATEGORY_VALIDATOR, UPDATE_BUSINESS_CATEGORY_VALIDATOR } from '../helpers/validators.js'
import { AuthVerifier, OptionalAuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import upload from '../middleware/upload.middleware.js'
import validator from '../middleware/validator.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.get('/get', OptionalAuthVerifier, getBusinessCategories)

router.get('/get/:id', OptionalAuthVerifier, getBusinessCategoryById)

router.post('/create', AuthVerifier, RestrictAccess([ROLES.ADMIN]), upload('business-category').single('image'), validator(CREATE_BUSINESS_CATEGORY_VALIDATOR), createBusinessCategory)

router.patch('/update/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), upload('business-category').single('image'), validator(UPDATE_BUSINESS_CATEGORY_VALIDATOR, { optional: true }), updateBusinessCategory)

router.delete('/delete/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), deleteBusinessCategory)

export default router
