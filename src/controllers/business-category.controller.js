import logger from '../config/logger.js'
import { removeFiles } from '../helpers/folder.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import BusinessCategory from '../models/business-category.model.js'
import { ROLES, searchRegex } from '../utils/index.js'

export const createBusinessCategory = async (req, res, next) => {

    const { body, file } = req
    const uploaded_image = file?.path

    const cleanupUploadedImage = () => {
        if (uploaded_image) {
            removeFiles(uploaded_image)
        }
    }

    try {

        const { name, description, active } = body

        if (!uploaded_image) {
            return res.status(400).json({
                success: false,
                message: 'Category image is required.',
            })
        }

        const exists = await BusinessCategory.findOne({ name })

        if (exists) {
            cleanupUploadedImage()
            return res.status(409).json({
                success: false,
                message: 'Business category with this name already exists.',
            })
        }

        const category = await BusinessCategory.create({
            name,
            description,
            image: uploaded_image,
            active,
        })

        logger.info(`Business category created: ${category.name}`)

        const data = await BusinessCategory.findById(category._id).lean({ virtuals: true })

        return res.status(201).json({
            success: true,
            message: 'Business category created successfully.',
            data,
        })

    } catch (error) {
        cleanupUploadedImage()
        logger.error(`Create Business Category Error: ${error.message}`)
        next(error)
    }
}

export const getBusinessCategories = async (req, res, next) => {
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
            BusinessCategory.find(filter).sort(sort).skip(skip).limit(limit).lean({ virtuals: true }),
            BusinessCategory.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'Business categories fetched successfully.',
            ...buildPaginationResponse(categories, total, page, page_size),
        })

    } catch (error) {
        logger.error(`Get Business Categories Error: ${error.message}`)
        next(error)
    }
}

export const getBusinessCategoryById = async (req, res, next) => {
    try {

        const { decoded, params } = req
        const { id } = params

        let category = await BusinessCategory.findById(id).lean({ virtuals: true })

        if (decoded?.role === ROLES.USER && (!category || !category.active)) {
            return res.status(404).json({
                success: false,
                message: 'Business category not found.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Business category fetched successfully.',
            data: category,
        })

    } catch (error) {
        logger.error(`Get Business Category Error: ${error.message}`)
        next(error)
    }
}

export const updateBusinessCategory = async (req, res, next) => {

    const { body, file, params } = req
    const uploaded_image = file?.path

    const cleanupUploadedImage = () => {
        if (uploaded_image) {
            removeFiles(uploaded_image)
        }
    }

    try {

        const { id } = params
        const { name, description, active } = body

        const category = await BusinessCategory.findById(id)

        if (!category) {
            cleanupUploadedImage()
            return res.status(404).json({
                success: false,
                message: 'Business category not found.',
            })
        }

        if (name && name !== category.name) {

            const exists = await BusinessCategory.findOne({ name })

            if (exists) {
                cleanupUploadedImage()
                return res.status(409).json({
                    success: false,
                    message: 'Business category with this name already exists.',
                })
            }

        }

        const updated_fields = {}

        if (name !== undefined) updated_fields.name = name
        if (description !== undefined) updated_fields.description = description
        if (active !== undefined) updated_fields.active = active

        if (uploaded_image) {
            cleanupUploadedImage()
            updated_fields.image = uploaded_image
        }

        const updated_category = await BusinessCategory.findByIdAndUpdate(
            id,
            { $set: updated_fields },
            { new: true, runValidators: true, lean: { virtuals: true } }
        )

        logger.info(`Business category updated: ${updated_category.name}`)

        return res.status(200).json({
            success: true,
            message: 'Business category updated successfully.',
            data: updated_category,
        })

    } catch (error) {
        cleanupUploadedImage()
        logger.error(`Update Business Category Error: ${error.message}`)
        next(error)
    }
}

export const deleteBusinessCategory = async (req, res, next) => {
    try {

        const { params } = req
        const { id } = params

        const category = await BusinessCategory.findByIdAndDelete(id)

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Business category not found.',
            })
        }

        if (category.image) {
            removeFiles(category.image)
        }

        logger.info(`Business category deleted: ${category.name}`)

        return res.status(200).json({
            success: true,
            message: 'Business category deleted successfully.',
        })

    } catch (error) {
        logger.error(`Delete Business Category Error: ${error.message}`)
        next(error)
    }
}
