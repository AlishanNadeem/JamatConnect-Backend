import express from 'express'
import { forgetPassword, login, logout, setPassword, signup, socialLogin, verifyOtp } from '../controllers/authentication.controller.js'
import { FORGET_PASSWORD_VALIDATOR, LOGIN_VALIDATOR, LOGOUT_VALIDATOR, SET_PASSWORD_VALIDATOR, SIGNUP_VALIDATOR, SOCIAL_LOGIN_VALIDATOR, VERIFY_OTP_VALIDATOR } from '../helpers/validators.js'
import { AuthVerifier } from '../middleware/auth.middleware.js'
import validator from '../middleware/validator.js'
import upload from '../middleware/upload.middleware.js'

const router = express.Router()

router.post('/signup', upload("user").single("image"), validator(SIGNUP_VALIDATOR), signup)

router.post('/login', validator(LOGIN_VALIDATOR), login)

router.post('/social-login', validator(SOCIAL_LOGIN_VALIDATOR), socialLogin)

router.post('/forget-password', validator(FORGET_PASSWORD_VALIDATOR), forgetPassword)

router.post('/verify-otp', validator(VERIFY_OTP_VALIDATOR), verifyOtp)

router.post('/set-password', validator(SET_PASSWORD_VALIDATOR), setPassword)

router.post('/logout', AuthVerifier, validator(LOGOUT_VALIDATOR, { optional: true }), logout)

export default router