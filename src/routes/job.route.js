import express from 'express'
import {
    applyToJob,
    createJob,
    deleteJob,
    getJobApplications,
    getJobById,
    getJobs,
    getMyJobs,
    toggleJobActive,
    updateJob,
} from '../controllers/job.controller.js'
import { CREATE_JOB_VALIDATOR, UPDATE_JOB_VALIDATOR } from '../helpers/validators.js'
import { AuthVerifier, OptionalAuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import validator from '../middleware/validator.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.get('/get', AuthVerifier, getJobs)

router.get('/my', AuthVerifier, RestrictAccess([ROLES.USER]), getMyJobs)

router.get('/get/:id', OptionalAuthVerifier, getJobById)

router.get('/applications/:id', AuthVerifier, getJobApplications)

router.post('/create', AuthVerifier, RestrictAccess([ROLES.USER]), validator(CREATE_JOB_VALIDATOR), createJob)

router.post('/apply/:id', AuthVerifier, RestrictAccess([ROLES.USER]), applyToJob)

router.patch('/update/:id', AuthVerifier, validator(UPDATE_JOB_VALIDATOR, { optional: true }), updateJob)

router.patch('/toggle-active/:id', AuthVerifier, toggleJobActive)

router.delete('/delete/:id', AuthVerifier, deleteJob)

export default router
