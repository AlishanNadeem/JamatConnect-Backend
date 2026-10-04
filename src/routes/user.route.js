import express from 'express'
import {
    changePassword,
    completeProfile,
    deleteAccount,
    getMyProfile,
    registerFcmToken,
    removeFcmToken,
    updateProfile,
} from '../controllers/user.controller.js'
import {
    CHANGE_PASSWORD_VALIDATOR,
    COMPLETE_PROFILE_VALIDATOR,
    FCM_TOKEN_VALIDATOR,
    UPDATE_PROFILE_VALIDATOR,
} from '../helpers/validators.js'
import { AuthVerifier } from '../middleware/auth.middleware.js'
import upload from '../middleware/upload.middleware.js'
import validator from '../middleware/validator.js'

const router = express.Router()

router.post('/complete-profile', AuthVerifier, validator(COMPLETE_PROFILE_VALIDATOR), completeProfile)

router.get('/my-profile', AuthVerifier, getMyProfile)

router.post('/change-password', AuthVerifier, validator(CHANGE_PASSWORD_VALIDATOR), changePassword)

router.patch('/update', AuthVerifier, upload('user').single('image'), validator(UPDATE_PROFILE_VALIDATOR, { optional: true }), updateProfile)

router.post('/fcm-token', AuthVerifier, validator(FCM_TOKEN_VALIDATOR), registerFcmToken)

router.delete('/fcm-token', AuthVerifier, validator(FCM_TOKEN_VALIDATOR), removeFcmToken)

router.delete('/delete-account', AuthVerifier, deleteAccount)

export default router