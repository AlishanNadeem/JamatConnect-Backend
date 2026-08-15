import express from "express";

const router = express.Router()

import auth_routes from './authentication.route.js'
import user_routes from './user.route.js'
import general_routes from './general.route.js'
import feedback_routes from './feedback.route.js'
import business_category_routes from './business-category.route.js'
import business_routes from './business.route.js'
import referral_routes from './referral.route.js'
import product_category_routes from './product-category.route.js'
import marketplace_routes from './marketplace.route.js'

router.use('/auth', auth_routes)
router.use('/user', user_routes)
router.use('/general', general_routes)
router.use('/feedback', feedback_routes)
router.use('/business-category', business_category_routes)
router.use('/business', business_routes)
router.use('/referral', referral_routes)
router.use('/product-category', product_category_routes)
router.use('/marketplace', marketplace_routes)

export default router
