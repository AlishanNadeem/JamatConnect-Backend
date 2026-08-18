import express from 'express'
import { createMarketplace, deleteMarketplace, getMarketplaceById, getMarketplaces, getMyMarketplaces, renewMarketplace, toggleMarketplaceActive, updateMarketplace } from '../controllers/marketplace.controller.js'
import { CREATE_MARKETPLACE_VALIDATOR, UPDATE_MARKETPLACE_VALIDATOR } from '../helpers/validators.js'
import { AuthVerifier, OptionalAuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import upload from '../middleware/upload.middleware.js'
import validator from '../middleware/validator.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.get('/get', AuthVerifier, getMarketplaces)

router.get('/my', AuthVerifier, RestrictAccess([ROLES.USER]), getMyMarketplaces)

router.get('/get/:id', OptionalAuthVerifier, getMarketplaceById)

router.post('/create', AuthVerifier, RestrictAccess([ROLES.USER]), upload('marketplace').single('image'), validator(CREATE_MARKETPLACE_VALIDATOR), createMarketplace)

router.patch('/update/:id', AuthVerifier, upload('marketplace').single('image'), validator(UPDATE_MARKETPLACE_VALIDATOR, { optional: true }), updateMarketplace)

router.patch('/renew/:id', AuthVerifier, renewMarketplace)

router.patch('/toggle-active/:id', AuthVerifier, toggleMarketplaceActive)

router.delete('/delete/:id', AuthVerifier, deleteMarketplace)

export default router
