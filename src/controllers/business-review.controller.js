import logger from '../config/logger.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import { generateReviewToken, getReviewLink, normalizeReviewToken } from '../helpers/review.js'
import Business from '../models/business.model.js'
import BusinessReview from '../models/business-review.model.js'
import { getBusinessByIdentifier, isBusinessOwner } from '../services/business.service.js'
import { BUSINESS_STATUS, getMediaUrl } from '../utils/index.js'

const mapReview = (review) => ({
    id: String(review._id),
    rating: review.rating,
    comment: review.comment || '',
    created_at: review.createdAt,
    name: review.user?.name || 'Member',
    image_url: review.user?.image_url || getMediaUrl(review.user?.image) || null,
    user_id: review.user?._id ? String(review.user._id) : String(review.user),
})

const refreshBusinessReviewStats = async (business_id) => {
    const [stats] = await BusinessReview.aggregate([
        { $match: { business: business_id } },
        {
            $group: {
                _id: null,
                review_count: { $sum: 1 },
                average_rating: { $avg: '$rating' },
            },
        },
    ])

    const review_count = stats?.review_count || 0
    const average_rating = review_count
        ? Number((stats.average_rating || 0).toFixed(1))
        : 0

    await Business.findByIdAndUpdate(business_id, {
        $set: { review_count, average_rating },
    })

    return { review_count, average_rating }
}

const ensureReviewToken = async (business) => {
    if (business.review_token) return business.review_token

    let token = generateReviewToken()
    let attempts = 0

    while (attempts < 5) {
        const exists = await Business.exists({ review_token: token })
        if (!exists) break
        token = generateReviewToken()
        attempts += 1
    }

    business.review_token = token
    await business.save()
    return token
}

export const getBusinessReviewQr = async (req, res, next) => {
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

        if (!isBusinessOwner(business, decoded.id)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        const review_token = await ensureReviewToken(business)
        const review_url = getReviewLink(review_token)

        return res.status(200).json({
            success: true,
            message: 'Review QR fetched successfully.',
            data: {
                business_id: String(business._id),
                business_name: business.name,
                review_token,
                review_url,
            },
        })
    } catch (error) {
        logger.error(`Get Business Review QR Error: ${error.message}`)
        next(error)
    }
}

export const getReviewContextByToken = async (req, res, next) => {
    try {
        const { params, decoded } = req
        const review_token = normalizeReviewToken(params.token)

        if (!review_token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review link.',
            })
        }

        const business = await Business.findOne({ review_token })
            .select('name logo status active user review_count average_rating')
            .lean({ virtuals: true })

        if (!business || business.status !== BUSINESS_STATUS.APPROVED || !business.active) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        const is_owner = isBusinessOwner(business, decoded.id)
        let my_review = null

        if (!is_owner) {
            const existing = await BusinessReview.findOne({
                business: business._id,
                user: decoded.id,
            }).lean()

            if (existing) {
                my_review = {
                    id: String(existing._id),
                    rating: existing.rating,
                    comment: existing.comment || '',
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Review context fetched successfully.',
            data: {
                business_id: String(business._id),
                business_name: business.name,
                logo_url: business.logo_url || null,
                review_count: business.review_count || 0,
                average_rating: business.average_rating || 0,
                is_owner,
                can_review: !is_owner,
                my_review,
            },
        })
    } catch (error) {
        logger.error(`Get Review Context Error: ${error.message}`)
        next(error)
    }
}

export const upsertBusinessReview = async (req, res, next) => {
    try {
        const { params, body, decoded } = req
        const review_token = normalizeReviewToken(params.token)
        const rating = Number(body.rating)
        const comment = typeof body.comment === 'string' ? body.comment.trim() : ''

        if (!review_token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid review link.',
            })
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be a whole number between 1 and 5.',
            })
        }

        const business = await Business.findOne({ review_token })

        if (!business || business.status !== BUSINESS_STATUS.APPROVED || !business.active) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        if (isBusinessOwner(business, decoded.id)) {
            return res.status(403).json({
                success: false,
                message: 'You cannot review your own business.',
            })
        }

        const existing = await BusinessReview.findOne({
            business: business._id,
            user: decoded.id,
        })

        let review
        let created = false

        if (existing) {
            existing.rating = rating
            existing.comment = comment
            review = await existing.save()
        } else {
            review = await BusinessReview.create({
                business: business._id,
                user: decoded.id,
                rating,
                comment,
            })
            created = true
        }

        const stats = await refreshBusinessReviewStats(business._id)

        await review.populate({
            path: 'user',
            select: 'name image',
        })

        const review_object = review.toObject({ virtuals: true })

        return res.status(created ? 201 : 200).json({
            success: true,
            message: created ? 'Review submitted successfully.' : 'Review updated successfully.',
            data: {
                review: mapReview(review_object),
                ...stats,
            },
        })
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this business.',
            })
        }

        logger.error(`Upsert Business Review Error: ${error.message}`)
        next(error)
    }
}

export const getBusinessReviews = async (req, res, next) => {
    try {
        const { params, query } = req
        const { id } = params
        const { skip, limit, page, page_size } = getPagination(query)

        const business = await getBusinessByIdentifier(id)

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        const filter = { business: business._id }
        const review_query = BusinessReview.find(filter)
            .populate('user', 'name image')
            .sort({ createdAt: -1 })

        if (skip !== null && limit !== null) {
            review_query.skip(skip).limit(limit)
        }

        const [reviews, total] = await Promise.all([
            review_query.lean({ virtuals: true }),
            BusinessReview.countDocuments(filter),
        ])

        const data = reviews.map(mapReview)

        return res.status(200).json({
            success: true,
            message: 'Reviews fetched successfully.',
            ...(page !== null
                ? buildPaginationResponse(data, total, page, page_size)
                : { data }),
            meta: {
                review_count: business.review_count || total,
                average_rating: business.average_rating || 0,
            },
        })
    } catch (error) {
        logger.error(`Get Business Reviews Error: ${error.message}`)
        next(error)
    }
}
