import logger from '../config/logger.js'
import { removeFiles } from '../helpers/folder.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import { generateReviewToken } from '../helpers/review.js'
import Business from '../models/business.model.js'
import BusinessCategory from '../models/business-category.model.js'
import BusinessReview from '../models/business-review.model.js'
import BusinessView from '../models/business-view.model.js'
import Job from '../models/job.model.js'
import { generateSlug, getBusinessByIdentifier, isBusinessOwner } from '../services/business.service.js'
import { BUSINESS_STATUS, getMediaUrl, isAdmin, ROLES, searchRegex } from '../utils/index.js'

const getViewDate = () => new Date().toISOString().slice(0, 10)

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
            review_token: generateReviewToken(),
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
            filter.status = BUSINESS_STATUS.APPROVED
            filter.active = true
        }

        if (decoded?.role === ROLES.USER) {
            filter.user = {
                $ne: decoded.id
            }
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

        const { decoded, params, query } = req
        const { id } = params
        const include_jobs = String(query.jobs).toLowerCase() === 'true'
        const include_reviews = query.reviews === undefined
            ? true
            : String(query.reviews).toLowerCase() === 'true'

        const business = await getBusinessByIdentifier(id)

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        const is_owner = decoded?.id && isBusinessOwner(business, decoded.id)
        const is_admin = isAdmin(decoded?.role)

        if ((!decoded || decoded?.role === ROLES.USER) && !is_owner && (business.status !== BUSINESS_STATUS.APPROVED || !business.active)) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        const response_data = { ...business }

        // Never expose review token on public/detail payloads
        delete response_data.review_token

        if (include_jobs) {

            const job_filter = { business: business._id }

            if (!is_owner && !is_admin) {
                job_filter.closed = false
            }

            response_data.jobs = await Job.find(job_filter)
                .select('title description employment_type workplace_type location business closed createdAt')
                .populate('business', 'name logo')
                .sort({ createdAt: -1 })
                .limit(3)
                .lean({ virtuals: true })

        }

        if (include_reviews) {
            const reviews = await BusinessReview.find({ business: business._id })
                .populate('user', 'name image')
                .sort({ createdAt: -1 })
                .limit(2)
                .lean({ virtuals: true })

            response_data.reviews = reviews.map((review) => ({
                id: String(review._id),
                rating: review.rating,
                comment: review.comment || '',
                created_at: review.createdAt,
                name: review.user?.name || 'Member',
                image_url: review.user?.image_url || getMediaUrl(review.user?.image) || null,
            }))
        }

        return res.status(200).json({
            success: true,
            message: 'Business fetched successfully.',
            data: response_data,
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
        } else if (business.status === BUSINESS_STATUS.REJECTED) {
            updated_fields.status = BUSINESS_STATUS.PENDING
            updated_fields.rejection_reason = null
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

export const toggleBusinessActive = async (req, res, next) => {
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

        business.active = !business.active
        await business.save()

        logger.info(`Business active toggled: ${business.name} (${business.active})`)

        return res.status(200).json({
            success: true,
            message: business.active ? 'Business activated successfully.' : 'Business deactivated successfully.',
            data: business.toObject({ virtuals: true }),
        })

    } catch (error) {
        logger.error(`Toggle Business Active Error: ${error.message}`)
        next(error)
    }
}

export const recordBusinessView = async (req, res, next) => {
    try {

        const { params, decoded } = req
        const { id } = params

        const business = await Business.findById(id).select('_id user status active views_count')

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        if (business.status !== BUSINESS_STATUS.APPROVED || !business.active) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        if (isBusinessOwner(business, decoded.id)) {
            return res.status(200).json({
                success: true,
                message: 'Owner view skipped.',
                data: {
                    counted: false,
                    views_count: business.views_count || 0,
                },
            })
        }

        const view_date = getViewDate()

        try {
            await BusinessView.create({
                business: business._id,
                user: decoded.id,
                date: view_date,
            })
        } catch (error) {
            if (error?.code === 11000) {
                return res.status(200).json({
                    success: true,
                    message: 'View already recorded for today.',
                    data: {
                        counted: false,
                        views_count: business.views_count || 0,
                    },
                })
            }
            throw error
        }

        const updated_business = await Business.findByIdAndUpdate(
            business._id,
            { $inc: { views_count: 1 } },
            { new: true, select: 'views_count' }
        )

        return res.status(200).json({
            success: true,
            message: 'Business view recorded.',
            data: {
                counted: true,
                views_count: updated_business?.views_count || 0,
            },
        })

    } catch (error) {
        logger.error(`Record Business View Error: ${error.message}`)
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

        await BusinessView.deleteMany({ business: id })
        await BusinessReview.deleteMany({ business: id })
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
