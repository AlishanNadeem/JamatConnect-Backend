import express from 'express'
import { createProductCategory, deleteProductCategory, getProductCategories, getProductCategoryById, getProductCategoryLov, updateProductCategory } from '../controllers/product-category.controller.js'
import { CREATE_PRODUCT_CATEGORY_VALIDATOR, UPDATE_PRODUCT_CATEGORY_VALIDATOR } from '../helpers/validators.js'
import { AuthVerifier, OptionalAuthVerifier, RestrictAccess } from '../middleware/auth.middleware.js'
import validator from '../middleware/validator.js'
import { ROLES } from '../utils/index.js'

const router = express.Router()

router.get('/get', OptionalAuthVerifier, getProductCategories)

router.get('/lov', AuthVerifier, getProductCategoryLov)

router.get('/get/:id', OptionalAuthVerifier, getProductCategoryById)

router.post('/create', AuthVerifier, RestrictAccess([ROLES.ADMIN]), validator(CREATE_PRODUCT_CATEGORY_VALIDATOR), createProductCategory)

router.patch('/update/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), validator(UPDATE_PRODUCT_CATEGORY_VALIDATOR, { optional: true }), updateProductCategory)

router.delete('/delete/:id', AuthVerifier, RestrictAccess([ROLES.ADMIN]), deleteProductCategory)

export default router
