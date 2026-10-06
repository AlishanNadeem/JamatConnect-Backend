import express from 'express'
import {
    confirmRedemption,
    createSpecial,
    getFeaturedSpecials,
    getMyVoucher,
    getRedeemedList,
    getSpecialById,
    getSpecials,
    redeemSpecial,
    toggleSpecialActive,
    verifyCode,
} from '../controllers/special.controller.js'
import { CREATE_SPECIAL_VALIDATOR, VERIFY_SPECIAL_CODE_VALIDATOR } from '../helpers/validators.js'
import { AuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import { rateLimit } from '../middleware/rate-limit.middleware.js'
import validator from '../middleware/validator.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.get('/featured', AuthVerifier, getFeaturedSpecials)

router.get('/get', AuthVerifier, getSpecials)

router.get('/get/:id', AuthVerifier, getSpecialById)

router.get('/voucher/:id', AuthVerifier, RestrictAccess([ROLES.USER]), getMyVoucher)

router.get('/redeemed/:id', AuthVerifier, RestrictAccess([ROLES.USER]), getRedeemedList)

router.post('/create', AuthVerifier, RestrictAccess([ROLES.USER]), validator(CREATE_SPECIAL_VALIDATOR), createSpecial)

router.post('/redeem/:id', AuthVerifier, RestrictAccess([ROLES.USER]), redeemSpecial)

router.post(
    '/verify',
    AuthVerifier,
    RestrictAccess([ROLES.USER]),
    rateLimit({
        window_ms: 60_000,
        max: 20,
        message: 'Too many verification attempts. Please try again in a minute.',
    }),
    validator(VERIFY_SPECIAL_CODE_VALIDATOR),
    verifyCode,
)

router.post(
    '/confirm',
    AuthVerifier,
    RestrictAccess([ROLES.USER]),
    rateLimit({
        window_ms: 60_000,
        max: 20,
        message: 'Too many confirmation attempts. Please try again in a minute.',
    }),
    validator(VERIFY_SPECIAL_CODE_VALIDATOR),
    confirmRedemption,
)

router.patch('/toggle-active/:id', AuthVerifier, RestrictAccess([ROLES.USER]), toggleSpecialActive)

export default router
