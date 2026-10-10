import express from 'express'
import {
    changePassword,
    completeProfile,
    createUser,
    deleteAccount,
    deleteUser,
    getMyProfile,
    getUserById,
    getUsers,
    registerFcmToken,
    removeFcmToken,
    toggleUserActive,
    toggleUserReferral,
    regenerateUserReferral,
    getSavedBusinesses,
    getSavedJobs,
    toggleSavedBusiness,
    toggleSavedJob,
    updateProfile,
} from '../controllers/user.controller.js'
import {
    CHANGE_PASSWORD_VALIDATOR,
    COMPLETE_PROFILE_VALIDATOR,
    CREATE_USER_VALIDATOR,
    FCM_TOKEN_VALIDATOR,
    UPDATE_PROFILE_VALIDATOR,
} from '../helpers/validators.js'
import { AuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import upload from '../middleware/upload.middleware.js'
import validator from '../middleware/validator.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.post('/complete-profile', AuthVerifier, validator(COMPLETE_PROFILE_VALIDATOR), completeProfile)

router.get('/my-profile', AuthVerifier, getMyProfile)

router.post('/change-password', AuthVerifier, validator(CHANGE_PASSWORD_VALIDATOR), changePassword)

router.patch('/update', AuthVerifier, upload('user').single('image'), validator(UPDATE_PROFILE_VALIDATOR, { optional: true }), updateProfile)

router.post('/fcm-token', AuthVerifier, validator(FCM_TOKEN_VALIDATOR), registerFcmToken)

router.delete('/fcm-token', AuthVerifier, validator(FCM_TOKEN_VALIDATOR), removeFcmToken)

router.delete('/delete-account', AuthVerifier, deleteAccount)

router.get('/saved-businesses', AuthVerifier, getSavedBusinesses)

router.patch('/saved-business/:id', AuthVerifier, toggleSavedBusiness)

router.get('/saved-jobs', AuthVerifier, getSavedJobs)

router.patch('/saved-job/:id', AuthVerifier, toggleSavedJob)

router.get('/get', AuthVerifier, RestrictAccess([ROLES.ADMIN]), getUsers)

router.get('/get/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), getUserById)

router.post(
    '/create',
    AuthVerifier,
    RestrictAccess([ROLES.ADMIN]),
    upload('user').single('image'),
    validator(CREATE_USER_VALIDATOR),
    createUser
)

router.patch(
    '/toggle-active/:id',
    AuthVerifier,
    RestrictAccess([ROLES.ADMIN]),
    toggleUserActive
)

router.patch(
    '/toggle-referral/:id',
    AuthVerifier,
    RestrictAccess([ROLES.ADMIN]),
    toggleUserReferral
)

router.patch(
    '/regenerate-referral/:id',
    AuthVerifier,
    RestrictAccess([ROLES.ADMIN]),
    regenerateUserReferral
)

router.delete('/delete/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), deleteUser)

export default router
