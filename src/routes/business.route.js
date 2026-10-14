import express from 'express'
import { createBusiness, deleteBusiness, getBusinessById, getBusinesses, getMyBusinesses, recordBusinessView, toggleBusinessActive, updateBusiness } from '../controllers/business.controller.js'
import { getBusinessReviewQr, getBusinessReviews, getReviewContextByToken, upsertBusinessReview } from '../controllers/business-review.controller.js'
import { CREATE_BUSINESS_VALIDATOR, UPDATE_BUSINESS_VALIDATOR, UPSERT_BUSINESS_REVIEW_VALIDATOR } from '../helpers/validators.js'
import { AuthVerifier, OptionalAuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import upload from '../middleware/upload.middleware.js'
import validator from '../middleware/validator.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.get('/get', AuthVerifier, getBusinesses)

router.get('/my', AuthVerifier, RestrictAccess([ROLES.USER]), getMyBusinesses)

router.get('/get/:id', OptionalAuthVerifier, getBusinessById)

router.get('/reviews/:id', OptionalAuthVerifier, getBusinessReviews)

router.get('/review-qr/:id', AuthVerifier, RestrictAccess([ROLES.USER]), getBusinessReviewQr)

router.get('/review-context/:token', AuthVerifier, RestrictAccess([ROLES.USER]), getReviewContextByToken)

router.post('/review/:token', AuthVerifier, RestrictAccess([ROLES.USER]), validator(UPSERT_BUSINESS_REVIEW_VALIDATOR), upsertBusinessReview)

router.post('/view/:id', AuthVerifier, RestrictAccess([ROLES.USER]), recordBusinessView)

router.post('/create', AuthVerifier, RestrictAccess([ROLES.USER]), upload('business').fields([{ name: 'logo', maxCount: 1 }, { name: 'image', maxCount: 1 }]), validator(CREATE_BUSINESS_VALIDATOR), createBusiness)

router.patch('/update/:id', AuthVerifier, upload('business').fields([{ name: 'logo', maxCount: 1 }, { name: 'image', maxCount: 1 }]), validator(UPDATE_BUSINESS_VALIDATOR, { optional: true }), updateBusiness)

router.patch('/toggle-active/:id', AuthVerifier, toggleBusinessActive)

router.delete('/delete/:id', AuthVerifier, deleteBusiness)

export default router
