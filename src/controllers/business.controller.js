import logger from '../config/logger.js'
import { removeFiles } from '../helpers/folder.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import Business from '../models/business.model.js'
import BusinessCategory from '../models/business-category.model.js'
import { generateSlug, getBusinessByIdentifier, isBusinessOwner } from '../services/business.service.js'
import { BUSINESS_STATUS, isAdmin, ROLES, searchRegex } from '../utils/index.js'

export const createBusiness = async (req, res, next) => {

    const { body, files, decoded } = req
    const uploaded_logo = files?.logo?.[0]?.path
    const uploaded_image = files?.image?.[0]?.path

    const cleanupUploadedFiles = () => {
        if (uploaded_logo) removeFiles(uploaded_logo)
        if (uploaded_image) removeFiles(uploaded_image)
    }

    try {

        const {
            name,
            description,
            category,
            email,
            phone,
            country_code,
            dialing_code,
            website,
            address,
            hours,
        } = body

        if (!uploaded_logo || !uploaded_image) {
            cleanupUploadedFiles()
            return res.status(400).json({
                success: false,
                message: 'Business logo and image are required.',
            })
        }

        const category_exists = await BusinessCategory.findOne({ _id: category, active: true })

        if (!category_exists) {
            cleanupUploadedFiles()
            return res.status(400).json({
                success: false,
                message: 'Invalid business category.',
            })
        }

        const slug = await generateSlug(name)

        let business = new Business({
            user: decoded.id,
            name,
            slug,
            description,
            category,
            email: email || undefined,
            phone,
            country_code,
            dialing_code,
            website: website || undefined,
            address,
            hours: hours || [],
            logo: uploaded_logo,
            image: uploaded_image,
        })

        await business.save()
        business = business.toObject({ virtuals: true })

        logger.info(`Business created: ${business.name}`)

        return res.status(201).json({
            success: true,
            message: 'Business created successfully.',
            data: business,
        })

    } catch (error) {
        cleanupUploadedFiles()
        logger.error(`Create Business Error: ${error.message}`)
        next(error)
    }
}

export const getBusinesses = async (req, res, next) => {
    try {

        const { decoded, query } = req
        const { category, search, active, status } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = {}

        if (category) filter.category = category
        if (search) filter.name = searchRegex(search)
        if (active !== undefined) filter.active = active
        if (status !== undefined) filter.status = status

        if (!decoded || decoded?.role === ROLES.USER) {

            if (decoded?.id) {
                filter.user = decoded.id
            }

            filter.status = BUSINESS_STATUS.APPROVED
            filter.active = true

        }

        const business_query = Business.find(filter)
            .select('name category logo address verified')
            .populate('category', 'name')
            .sort({ featured: -1, createdAt: -1 })

        if (skip !== null && limit !== null) {
            business_query.skip(skip).limit(limit)
        }

        const [businesses, total] = await Promise.all([
            business_query.lean({ virtuals: true }),
            Business.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'Businesses fetched successfully.',
            ...buildPaginationResponse(businesses, total, page, page_size),
        })

    } catch (error) {
        logger.error(`Get Businesses Error: ${error.message}`)
        next(error)
    }
}

export const getMyBusinesses = async (req, res, next) => {
    try {

        const { decoded, query } = req
        const { category, search, active, status } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = { user: decoded.id }

        if (category) filter.category = category
        if (search) filter.name = searchRegex(search)
        if (active !== undefined) filter.active = active
        if (status !== undefined) filter.status = status

        const business_query = Business.find(filter)
            .select('name description status active category logo image verified country_code dialing_code phone email website address createdAt')
            .populate('category', 'name')
            .sort({ createdAt: -1 })

        if (skip !== null && limit !== null) {
            business_query.skip(skip).limit(limit)
        }

        const [businesses, total] = await Promise.all([
            business_query.lean({ virtuals: true }),
            Business.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'My businesses fetched successfully.',
            ...buildPaginationResponse(businesses, total, page, page_size),
        })

    } catch (error) {
        logger.error(`Get My Businesses Error: ${error.message}`)
        next(error)
    }
}

export const getBusinessById = async (req, res, next) => {
    try {

        const { decoded, params } = req
        const { id } = params

        const business = await getBusinessByIdentifier(id)

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        if ((!decoded || decoded?.role === ROLES.USER) && (business.status !== BUSINESS_STATUS.APPROVED || !business.active)) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Business fetched successfully.',
            data: business,
        })

    } catch (error) {
        logger.error(`Get Business Error: ${error.message}`)
        next(error)
    }
}

export const updateBusiness = async (req, res, next) => {

    const { body, files, params, decoded } = req
    const { id } = params
    const uploaded_logo = files?.logo?.[0]?.path
    const uploaded_image = files?.image?.[0]?.path

    const cleanupUploadedFiles = () => {
        if (uploaded_logo) removeFiles(uploaded_logo)
        if (uploaded_image) removeFiles(uploaded_image)
    }

    try {

        const business = await Business.findById(id)

        if (!business) {
            cleanupUploadedFiles()
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        if (!isBusinessOwner(business, decoded.id) && !isAdmin(decoded?.role)) {
            cleanupUploadedFiles()
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        const {
            name,
            description,
            category,
            email,
            phone,
            country_code,
            dialing_code,
            website,
            address,
            hours,
            status,
            verified,
            featured,
            active,
            rejection_reason,
        } = body

        const updated_fields = {}

        if (name !== undefined) updated_fields.name = name
        if (description !== undefined) updated_fields.description = description
        if (email !== undefined) updated_fields.email = email || undefined
        if (phone !== undefined) updated_fields.phone = phone
        if (country_code !== undefined) updated_fields.country_code = country_code
        if (dialing_code !== undefined) updated_fields.dialing_code = dialing_code
        if (website !== undefined) updated_fields.website = website || undefined
        if (address !== undefined) updated_fields.address = address
        if (hours !== undefined) updated_fields.hours = hours

        if (category !== undefined) {
            const category_exists = await BusinessCategory.findOne({ _id: category, active: true })

            if (!category_exists) {
                cleanupUploadedFiles()
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or inactive business category.',
                })
            }

            updated_fields.category = category
        }

        if (uploaded_logo) {
            if (business.logo) removeFiles(business.logo)
            updated_fields.logo = uploaded_logo
        }

        if (uploaded_image) {
            if (business.image) removeFiles(business.image)
            updated_fields.image = uploaded_image
        }

        if (isAdmin(decoded?.role)) {
            if (status !== undefined) updated_fields.status = status
            if (verified !== undefined) updated_fields.verified = verified
            if (featured !== undefined) updated_fields.featured = featured
            if (active !== undefined) updated_fields.active = active
            if (rejection_reason !== undefined) updated_fields.rejection_reason = rejection_reason || null
        }

        const updated_business = await Business.findByIdAndUpdate(
            id,
            { $set: updated_fields },
            { new: true, runValidators: true, lean: { virtuals: true } }
        )

        logger.info(`Business updated: ${updated_business.name}`)

        return res.status(200).json({
            success: true,
            message: 'Business updated successfully.',
            data: updated_business,
        })

    } catch (error) {
        cleanupUploadedFiles()
        logger.error(`Update Business Error: ${error.message}`)
        next(error)
    }
}

export const deleteBusiness = async (req, res, next) => {
    try {

        const { params, decoded } = req
        const { id } = params

        const business = await Business.findById(id)

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        if (!isBusinessOwner(business, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        await Business.findByIdAndDelete(id)

        if (business.logo) removeFiles(business.logo)
        if (business.image) removeFiles(business.image)

        logger.info(`Business deleted: ${business.name}`)

        return res.status(200).json({
            success: true,
            message: 'Business deleted successfully.',
        })

    } catch (error) {
        logger.error(`Delete Business Error: ${error.message}`)
        next(error)
    }
}
