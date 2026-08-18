import logger from '../config/logger.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import ProductCategory from '../models/product-category.model.js'
import { ROLES, searchRegex } from '../utils/index.js'

export const createProductCategory = async (req, res, next) => {
    try {

        const { name, active } = req.body

        const exists = await ProductCategory.findOne({ name })

        if (exists) {
            return res.status(409).json({
                success: false,
                message: 'Product category with this name already exists.',
            })
        }

        const category = await ProductCategory.create({
            name,
            active,
        })

        logger.info(`Product category created: ${category.name}`)

        return res.status(201).json({
            success: true,
            message: 'Product category created successfully.',
            data: category,
        })

    } catch (error) {
        logger.error(`Create Product Category Error: ${error.message}`)
        next(error)
    }
}

export const getProductCategories = async (req, res, next) => {
    try {

        const { decoded, query } = req
        const { active, search } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const sort = {
            name: 1
        }

        const filter = {}

        if (active !== undefined) filter.active = active
        if (search !== undefined) filter.name = searchRegex(search)

        if (!decoded || (decoded && decoded?.role === ROLES.USER)) {
            filter.active = true
        }

        const [categories, total] = await Promise.all([
            ProductCategory.find(filter).sort(sort).skip(skip).limit(limit),
            ProductCategory.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'Product categories fetched successfully.',
            ...buildPaginationResponse(categories, total, page, page_size),
        })

    } catch (error) {
        logger.error(`Get Product Categories Error: ${error.message}`)
        next(error)
    }
}

export const getProductCategoryLov = async (req, res, next) => {
    try {

        const categories = await ProductCategory.find({ active: true })
            .select('name')
            .sort({ name: 1 })
            .lean()

        const data = categories.map((category) => ({
            label: category.name,
            value: category._id,
        }))

        return res.status(200).json({
            success: true,
            message: 'Product category list fetched successfully.',
            data,
        })

    } catch (error) {
        logger.error(`Get Product Category LOV Error: ${error.message}`)
        next(error)
    }
}

export const getProductCategoryById = async (req, res, next) => {
    try {

        const { decoded, params } = req
        const { id } = params

        const category = await ProductCategory.findById(id)

        if (decoded?.role === ROLES.USER && (!category || !category.active)) {
            return res.status(404).json({
                success: false,
                message: 'Product category not found.',
            })
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Product category not found.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Product category fetched successfully.',
            data: category,
        })

    } catch (error) {
        logger.error(`Get Product Category Error: ${error.message}`)
        next(error)
    }
}

export const updateProductCategory = async (req, res, next) => {
    try {

        const { body, params } = req
        const { id } = params
        const { name, active } = body

        const category = await ProductCategory.findById(id)

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Product category not found.',
            })
        }

        if (name && name !== category.name) {

            const exists = await ProductCategory.findOne({ name })

            if (exists) {
                return res.status(409).json({
                    success: false,
                    message: 'Product category with this name already exists.',
                })
            }

        }

        const updated_fields = {}

        if (name !== undefined) updated_fields.name = name
        if (active !== undefined) updated_fields.active = active

        const updated_category = await ProductCategory.findByIdAndUpdate(
            id,
            { $set: updated_fields },
            { new: true, runValidators: true }
        )

        logger.info(`Product category updated: ${updated_category.name}`)

        return res.status(200).json({
            success: true,
            message: 'Product category updated successfully.',
            data: updated_category,
        })

    } catch (error) {
        logger.error(`Update Product Category Error: ${error.message}`)
        next(error)
    }
}

export const deleteProductCategory = async (req, res, next) => {
    try {

        const { params } = req
        const { id } = params

        const category = await ProductCategory.findByIdAndDelete(id)

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Product category not found.',
            })
        }

        logger.info(`Product category deleted: ${category.name}`)

        return res.status(200).json({
            success: true,
            message: 'Product category deleted successfully.',
        })

    } catch (error) {
        logger.error(`Delete Product Category Error: ${error.message}`)
        next(error)
    }
}
