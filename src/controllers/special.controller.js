import logger from '../config/logger.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import Business from '../models/business.model.js'
import Redemption from '../models/redemption.model.js'
import Special from '../models/special.model.js'
import { isBusinessOwner } from '../services/business.service.js'
import {
    expireRedemptionIfNeeded,
    generateRedemptionCode,
    getRedemptionExpiryDate,
} from '../services/special.service.js'
import { BUSINESS_STATUS, isAdmin, REDEMPTION_STATUS } from '../utils/index.js'

const populateSpecialBusiness = {
    path: 'business',
    select: 'name logo user status active',
}

const formatRedemption = (redemption) => {

    if (!redemption) return null

    const data = typeof redemption.toObject === 'function'
        ? redemption.toObject({ virtuals: true })
        : redemption

    return {
        ...data,
        special: data.special,
        user: data.user
            ? {
                _id: data.user._id,
                name: data.user.name,
            }
            : undefined,
    }
}

export const createSpecial = async (req, res, next) => {
    try {
        const { body, decoded } = req
        const { business, title, description, discount } = body

        const business_doc = await Business.findById(business)

        if (!business_doc) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        if (!isBusinessOwner(business_doc, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        if (business_doc.status !== BUSINESS_STATUS.APPROVED || !business_doc.active) {
            return res.status(400).json({
                success: false,
                message: 'Business must be approved and active to create specials.',
            })
        }

        let special = new Special({
            business,
            title,
            description,
            discount,
            is_active: true,
        })

        await special.save()
        special = await Special.findById(special._id)
            .populate(populateSpecialBusiness)
            .lean({ virtuals: true })

        logger.info(`Special created: ${special.title}`)

        return res.status(201).json({
            success: true,
            message: 'Special created successfully.',
            data: special,
        })
    } catch (error) {
        logger.error(`Create Special Error: ${error.message}`)
        next(error)
    }
}

export const getFeaturedSpecials = async (req, res, next) => {
    try {

        const { query } = req
        const { skip, limit, page, page_size } = getPagination(query)

        const approved_business_ids = await Business.find({
            status: BUSINESS_STATUS.APPROVED,
            active: true,
        }).distinct('_id')

        const filter = {
            is_active: true,
            business: { $in: approved_business_ids },
        }

        const special_query = Special.find(filter)
            .populate(populateSpecialBusiness)
            .sort({ createdAt: -1 })

        if (skip !== null && limit !== null) {
            special_query.skip(skip).limit(limit)
        }

        const [specials, total] = await Promise.all([
            special_query.lean({ virtuals: true }),
            Special.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'Featured specials fetched successfully.',
            ...buildPaginationResponse(specials, total, page, page_size),
        })
    } catch (error) {
        logger.error(`Get Featured Specials Error: ${error.message}`)
        next(error)
    }
}

export const getSpecials = async (req, res, next) => {
    try {

        const { query, decoded } = req
        const { business } = query
        const { skip, limit, page, page_size } = getPagination(query)

        if (!business) {
            return res.status(400).json({
                success: false,
                message: 'Business is required.',
            })
        }

        const business_doc = await Business.findById(business)

        if (!business_doc) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        const is_owner = isBusinessOwner(business_doc, decoded.id) || isAdmin(decoded?.role)

        if (!is_owner) {
            if (business_doc.status !== BUSINESS_STATUS.APPROVED || !business_doc.active) {
                return res.status(200).json({
                    success: true,
                    message: 'Specials fetched successfully.',
                    ...buildPaginationResponse([], 0, page, page_size),
                })
            }
        }

        const filter = {
            business,
            ...(is_owner ? {} : { is_active: true }),
        }

        const special_query = Special.find(filter)
            .populate(populateSpecialBusiness)
            .sort({ createdAt: -1 })

        if (skip !== null && limit !== null) {
            special_query.skip(skip).limit(limit)
        }

        const [specials, total] = await Promise.all([
            special_query.lean({ virtuals: true }),
            Special.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'Specials fetched successfully.',
            ...buildPaginationResponse(specials, total, page, page_size),
        })

    } catch (error) {
        logger.error(`Get Specials Error: ${error.message}`)
        next(error)
    }
}

export const getSpecialById = async (req, res, next) => {
    try {

        const { params, decoded } = req
        const { id } = params

        const special = await Special.findById(id)
            .populate(populateSpecialBusiness)
            .lean({ virtuals: true })

        if (!special) {
            return res.status(404).json({
                success: false,
                message: 'Special not found.',
            })
        }

        const is_owner = special.business?.user?.toString() === decoded?.id || isAdmin(decoded?.role)

        if (!special.is_active && !is_owner) {
            return res.status(404).json({
                success: false,
                message: 'Special not found.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Special fetched successfully.',
            data: special,
        })

    } catch (error) {
        logger.error(`Get Special By Id Error: ${error.message}`)
        next(error)
    }
}

export const toggleSpecialActive = async (req, res, next) => {
    try {

        const { params, decoded } = req
        const { id } = params

        const special = await Special.findById(id).populate('business', 'user')

        if (!special) {
            return res.status(404).json({
                success: false,
                message: 'Special not found.',
            })
        }

        if (!isBusinessOwner(special.business, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        special.is_active = !special.is_active
        await special.save()

        const data = await Special.findById(special._id)
            .populate(populateSpecialBusiness)
            .lean({ virtuals: true })

        return res.status(200).json({
            success: true,
            message: special.is_active
                ? 'Special activated successfully.'
                : 'Special deactivated successfully.',
            data,
        })

    } catch (error) {
        logger.error(`Toggle Special Active Error: ${error.message}`)
        next(error)
    }
}

export const redeemSpecial = async (req, res, next) => {
    try {

        const { params, decoded } = req
        const { id } = params
        const now = new Date()

        const special = await Special.findById(id).populate(populateSpecialBusiness)

        if (!special || !special.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Special not found or is no longer available.',
            })
        }

        if (
            special.business?.status !== BUSINESS_STATUS.APPROVED
            || !special.business?.active
        ) {
            return res.status(400).json({
                success: false,
                message: 'This special is not available right now.',
            })
        }

        let redemption = await Redemption.findOne({
            special: id,
            user: decoded.id,
        })

        if (redemption) {

            redemption = await expireRedemptionIfNeeded(redemption, now)

            if (redemption.status === REDEMPTION_STATUS.USED) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already redeemed this special.',
                    data: {
                        status: REDEMPTION_STATUS.USED,
                        redeemed_at: redemption.redeemed_at,
                    },
                })
            }

            if (redemption.status === REDEMPTION_STATUS.EXPIRED) {
                return res.status(400).json({
                    success: false,
                    message: 'Your code for this special has expired. A new code cannot be generated.',
                    data: {
                        status: REDEMPTION_STATUS.EXPIRED,
                        expires_at: redemption.expires_at,
                    },
                })
            }

            const data = await Redemption.findById(redemption._id)
                .populate({
                    path: 'special',
                    populate: populateSpecialBusiness,
                })
                .populate('user', 'name')
                .lean({ virtuals: true })

            return res.status(200).json({
                success: true,
                message: 'Existing voucher retrieved.',
                data: formatRedemption(data),
            })
        }

        try {
            const code = await generateRedemptionCode()
            redemption = await Redemption.create({
                special: id,
                user: decoded.id,
                code,
                status: REDEMPTION_STATUS.ACTIVE,
                expires_at: getRedemptionExpiryDate(now),
            })
        } catch (error) {
            if (error?.code === 11000) {
                redemption = await Redemption.findOne({
                    special: id,
                    user: decoded.id,
                })

                if (redemption) {
                    const data = await Redemption.findById(redemption._id)
                        .populate({
                            path: 'special',
                            populate: populateSpecialBusiness,
                        })
                        .populate('user', 'name')
                        .lean({ virtuals: true })

                    return res.status(200).json({
                        success: true,
                        message: 'Existing voucher retrieved.',
                        data: formatRedemption(data),
                    })
                }
            }
            throw error
        }

        const data = await Redemption.findById(redemption._id)
            .populate({
                path: 'special',
                populate: populateSpecialBusiness,
            })
            .populate('user', 'name')
            .lean({ virtuals: true })

        return res.status(201).json({
            success: true,
            message: 'Redemption code created successfully.',
            data: formatRedemption(data),
        })
    } catch (error) {
        logger.error(`Redeem Special Error: ${error.message}`)
        next(error)
    }
}

export const getMyVoucher = async (req, res, next) => {
    try {
        const { params, decoded } = req
        const { id } = params
        const now = new Date()

        let redemption = await Redemption.findOne({
            special: id,
            user: decoded.id,
        })

        if (!redemption) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found.',
            })
        }

        redemption = await expireRedemptionIfNeeded(redemption, now)

        const data = await Redemption.findById(redemption._id)
            .populate({
                path: 'special',
                populate: populateSpecialBusiness,
            })
            .populate('user', 'name')
            .lean({ virtuals: true })

        return res.status(200).json({
            success: true,
            message: 'Voucher fetched successfully.',
            data: formatRedemption(data),
        })
    } catch (error) {
        logger.error(`Get My Voucher Error: ${error.message}`)
        next(error)
    }
}

export const verifyCode = async (req, res, next) => {
    try {
        const { body, decoded } = req
        const code = String(body.code || '').trim().toUpperCase()
        const now = new Date()

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Code is required.',
            })
        }

        let redemption = await Redemption.findOne({ code })
            .populate({
                path: 'special',
                populate: populateSpecialBusiness,
            })
            .populate('user', 'name')

        if (!redemption || !redemption.special) {
            return res.status(404).json({
                success: false,
                message: 'Invalid code.',
                data: { status: 'invalid' },
            })
        }

        const business = redemption.special.business
        const owns_business = business?.user?.toString() === decoded.id || isAdmin(decoded?.role)

        if (!owns_business) {
            return res.status(404).json({
                success: false,
                message: 'Invalid code.',
                data: { status: 'invalid' },
            })
        }

        redemption = await expireRedemptionIfNeeded(redemption, now)

        if (redemption.status === REDEMPTION_STATUS.USED) {
            return res.status(200).json({
                success: true,
                message: 'This code has already been used.',
                data: {
                    status: REDEMPTION_STATUS.USED,
                    redeemed_at: redemption.redeemed_at,
                    user_name: redemption.user?.name,
                    special_title: redemption.special?.title,
                    code: redemption.code,
                },
            })
        }

        if (redemption.status === REDEMPTION_STATUS.EXPIRED) {
            return res.status(200).json({
                success: true,
                message: 'This code has expired.',
                data: {
                    status: REDEMPTION_STATUS.EXPIRED,
                    expires_at: redemption.expires_at,
                    user_name: redemption.user?.name,
                    special_title: redemption.special?.title,
                    code: redemption.code,
                },
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Code is valid.',
            data: {
                status: REDEMPTION_STATUS.ACTIVE,
                redemption_id: redemption._id,
                code: redemption.code,
                expires_at: redemption.expires_at,
                user_name: redemption.user?.name,
                special_title: redemption.special?.title,
                special_id: redemption.special?._id,
            },
        })
    } catch (error) {
        logger.error(`Verify Code Error: ${error.message}`)
        next(error)
    }
}

export const confirmRedemption = async (req, res, next) => {
    try {
        const { body, decoded } = req
        const code = String(body.code || '').trim().toUpperCase()
        const now = new Date()

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Code is required.',
            })
        }

        const redemption = await Redemption.findOne({ code })
            .populate({
                path: 'special',
                populate: populateSpecialBusiness,
            })
            .populate('user', 'name')

        if (!redemption || !redemption.special) {
            return res.status(404).json({
                success: false,
                message: 'Invalid code.',
                data: { status: 'invalid' },
            })
        }

        const business = redemption.special.business
        const owns_business = business?.user?.toString() === decoded.id || isAdmin(decoded?.role)

        if (!owns_business) {
            return res.status(404).json({
                success: false,
                message: 'Invalid code.',
                data: { status: 'invalid' },
            })
        }

        if (redemption.status === REDEMPTION_STATUS.USED) {
            return res.status(400).json({
                success: false,
                message: 'This code has already been used.',
                data: {
                    status: REDEMPTION_STATUS.USED,
                    redeemed_at: redemption.redeemed_at,
                },
            })
        }

        const updated = await Redemption.findOneAndUpdate(
            {
                _id: redemption._id,
                status: REDEMPTION_STATUS.ACTIVE,
                expires_at: { $gt: now },
            },
            {
                $set: {
                    status: REDEMPTION_STATUS.USED,
                    redeemed_at: now,
                },
            },
            { new: true },
        )
            .populate({
                path: 'special',
                populate: populateSpecialBusiness,
            })
            .populate('user', 'name')

        if (!updated) {
            const current = await expireRedemptionIfNeeded(redemption, now)

            if (current.status === REDEMPTION_STATUS.USED) {
                return res.status(400).json({
                    success: false,
                    message: 'This code has already been used.',
                    data: {
                        status: REDEMPTION_STATUS.USED,
                        redeemed_at: current.redeemed_at,
                    },
                })
            }

            return res.status(400).json({
                success: false,
                message: 'This code has expired.',
                data: {
                    status: REDEMPTION_STATUS.EXPIRED,
                    expires_at: current.expires_at,
                },
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Redemption confirmed successfully.',
            data: {
                status: REDEMPTION_STATUS.USED,
                redeemed_at: updated.redeemed_at,
                user_name: updated.user?.name,
                special_title: updated.special?.title,
                code: updated.code,
            },
        })
    } catch (error) {
        logger.error(`Confirm Redemption Error: ${error.message}`)
        next(error)
    }
}

export const getRedeemedList = async (req, res, next) => {
    try {
        const { params, decoded, query } = req
        const { id } = params
        const { skip, limit, page, page_size } = getPagination(query)

        const special = await Special.findById(id).populate('business', 'user')

        if (!special) {
            return res.status(404).json({
                success: false,
                message: 'Special not found.',
            })
        }

        if (!isBusinessOwner(special.business, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        const filter = {
            special: id,
            status: REDEMPTION_STATUS.USED,
        }

        const redemption_query = Redemption.find(filter)
            .select('redeemed_at user')
            .populate('user', 'name')
            .sort({ redeemed_at: -1 })

        if (skip !== null && limit !== null) {
            redemption_query.skip(skip).limit(limit)
        }

        const [redemptions, total] = await Promise.all([
            redemption_query.lean({ virtuals: true }),
            Redemption.countDocuments(filter),
        ])

        const data = redemptions.map((item) => ({
            _id: item._id,
            name: item.user?.name || 'Unknown',
            redeemed_at: item.redeemed_at,
        }))

        return res.status(200).json({
            success: true,
            message: 'Redeemed list fetched successfully.',
            total,
            ...buildPaginationResponse(data, total, page, page_size),
        })
    } catch (error) {
        logger.error(`Get Redeemed List Error: ${error.message}`)
        next(error)
    }
}
