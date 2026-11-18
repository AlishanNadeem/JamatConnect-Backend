import express from 'express'
import {
    createSpecial,
    deleteSpecial,
    getMyRedemptions,
    getMySpecials,
    getSpecialById,
    getSpecials,
    getSpecialsByBusiness,
    redeemSpecial,
    toggleSpecialActive,
    updateSpecial,
    useRedemptionCode,
} from '../controllers/special.controller.js'
import { CREATE_SPECIAL_VALIDATOR, UPDATE_SPECIAL_VALIDATOR } from '../helpers/validators.js'
import { AuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import validator from '../middleware/validator.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.get('/get', AuthVerifier, getSpecials)

router.get('/my', AuthVerifier, RestrictAccess([ROLES.USER]), getMySpecials)

router.get('/my-redemptions', AuthVerifier, RestrictAccess([ROLES.USER]), getMyRedemptions)

router.get('/business/:id', AuthVerifier, getSpecialsByBusiness)

router.get('/get/:id', AuthVerifier, getSpecialById)

router.post('/create', AuthVerifier, RestrictAccess([ROLES.USER]), validator(CREATE_SPECIAL_VALIDATOR), createSpecial)

router.patch('/update/:id', AuthVerifier, RestrictAccess([ROLES.USER]), validator(UPDATE_SPECIAL_VALIDATOR, { optional: true }), updateSpecial)

router.patch('/toggle-active/:id', AuthVerifier, RestrictAccess([ROLES.USER]), toggleSpecialActive)

router.delete('/delete/:id', AuthVerifier, RestrictAccess([ROLES.USER]), deleteSpecial)

router.post('/redeem/:id', AuthVerifier, RestrictAccess([ROLES.USER]), redeemSpecial)

router.patch('/redemption/:code/use', AuthVerifier, RestrictAccess([ROLES.USER]), useRedemptionCode)

export default router
