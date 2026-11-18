import logger from '../config/logger.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import Business from '../models/business.model.js'
import Redemption from '../models/redemption.model.js'
import Special from '../models/special.model.js'
import { isBusinessOwner } from '../services/business.service.js'
import { isSpecialOwner } from '../services/special.service.js'
import {
    BUSINESS_STATUS,
    generateRedemptionCode,
    getSpecialExpiryDate,
    isAdmin,
    isWithinSpecialEditWindow,
    REDEMPTION_STATUS,
    searchRegex,
} from '../utils/index.js'

const activeSpecialFilter = () => ({
    is_active: true,
    expires_at: { $gt: new Date() },
})

const populateBusiness = {
    path: 'business',
    select: 'name logo user category status active address',
    populate: { path: 'category', select: 'name' },
}

const mapSpecial = (special, redemption = null) => ({
    ...special,
    my_redemption: redemption,
})

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
                message: 'Business must be approved and active to post specials.',
            })
        }

        let special = new Special({
            business,
            title,
            description,
            discount,
            expires_at: getSpecialExpiryDate(),
        })

        await special.save()
        special = await Special.findById(special._id)
            .populate(populateBusiness)
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

export const getSpecials = async (req, res, next) => {
    try {
        const { query } = req
        const { search, business } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = {
            ...activeSpecialFilter(),
        }

        if (business) filter.business = business
        if (search) {
            filter.$or = [
                { title: searchRegex(search) },
                { discount: searchRegex(search) },
                { description: searchRegex(search) },
            ]
        }

        const special_query = Special.find(filter)
            .populate(populateBusiness)
            .sort({ createdAt: -1 })

        if (skip !== null && limit !== null) {
            special_query.skip(skip).limit(limit)
        }

        const [specials, total] = await Promise.all([
            special_query.lean({ virtuals: true }),
            Special.countDocuments(filter),
        ])

        const visible = specials.filter((item) => (
            item.business
            && item.business.status === BUSINESS_STATUS.APPROVED
            && item.business.active
        ))

        return res.status(200).json({
            success: true,
            message: 'Specials fetched successfully.',
            ...buildPaginationResponse(visible, total, page, page_size),
        })
    } catch (error) {
        logger.error(`Get Specials Error: ${error.message}`)
        next(error)
    }
}

export const getMySpecials = async (req, res, next) => {
    try {
        const { decoded, query } = req
        const { business } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const owned_business_ids = await Business.find({ user: decoded.id }).distinct('_id')

        if (!owned_business_ids.length) {
            return res.status(200).json({
                success: true,
                message: 'Specials fetched successfully.',
                ...buildPaginationResponse([], 0, page, page_size),
            })
        }

        const filter = {
            business: { $in: owned_business_ids },
        }

        if (business) {
            const owns_business = owned_business_ids.some((id) => String(id) === String(business))
            if (!owns_business && !isAdmin(decoded?.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized.',
                })
            }
            filter.business = business
        }

        const special_query = Special.find(filter)
            .populate(populateBusiness)
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
        logger.error(`Get My Specials Error: ${error.message}`)
        next(error)
    }
}

export const getSpecialsByBusiness = async (req, res, next) => {
    try {
        const { params, query } = req
        const { id } = params
        const { skip, limit, page, page_size } = getPagination(query)

        const business = await Business.findById(id).select('status active')

        if (!business || business.status !== BUSINESS_STATUS.APPROVED || !business.active) {
            return res.status(200).json({
                success: true,
                message: 'Specials fetched successfully.',
                ...buildPaginationResponse([], 0, page, page_size),
            })
        }

        const filter = {
            business: id,
            ...activeSpecialFilter(),
        }

        const special_query = Special.find(filter)
            .populate(populateBusiness)
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
        logger.error(`Get Business Specials Error: ${error.message}`)
        next(error)
    }
}

export const getSpecialById = async (req, res, next) => {
    try {
        const { params, decoded } = req
        const { id } = params

        const special = await Special.findById(id)
            .populate(populateBusiness)
            .lean({ virtuals: true })

        if (!special) {
            return res.status(404).json({
                success: false,
                message: 'Special not found.',
            })
        }

        let redemption = null
        if (decoded?.id) {
            redemption = await Redemption.findOne({
                special: id,
                user: decoded.id,
            }).lean({ virtuals: true })
        }

        return res.status(200).json({
            success: true,
            message: 'Special fetched successfully.',
            data: mapSpecial(special, redemption),
        })
    } catch (error) {
        logger.error(`Get Special By Id Error: ${error.message}`)
        next(error)
    }
}

export const updateSpecial = async (req, res, next) => {
    try {
        const { params, body, decoded } = req
        const { id } = params

        const special = await Special.findById(id).populate('business', 'user')

        if (!special) {
            return res.status(404).json({
                success: false,
                message: 'Special not found.',
            })
        }

        if (!isSpecialOwner(special.business.user, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        if (!isWithinSpecialEditWindow(special.createdAt) && !isAdmin(decoded?.role)) {
            return res.status(400).json({
                success: false,
                message: 'Special can only be edited within 24 hours of posting.',
            })
        }

        const { title, description, discount } = body
        if (title !== undefined) special.title = title
        if (description !== undefined) special.description = description
        if (discount !== undefined) special.discount = discount

        await special.save()

        const updated = await Special.findById(id)
            .populate(populateBusiness)
            .lean({ virtuals: true })

        return res.status(200).json({
            success: true,
            message: 'Special updated successfully.',
            data: updated,
        })
    } catch (error) {
        logger.error(`Update Special Error: ${error.message}`)
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

        if (!isSpecialOwner(special.business.user, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        if (special.expires_at <= new Date() && !special.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Expired specials cannot be reactivated.',
            })
        }

        special.is_active = !special.is_active
        await special.save()

        const updated = await Special.findById(id)
            .populate(populateBusiness)
            .lean({ virtuals: true })

        return res.status(200).json({
            success: true,
            message: special.is_active ? 'Special activated successfully.' : 'Special deactivated successfully.',
            data: updated,
        })
    } catch (error) {
        logger.error(`Toggle Special Active Error: ${error.message}`)
        next(error)
    }
}

export const deleteSpecial = async (req, res, next) => {
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

        if (!isSpecialOwner(special.business.user, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        await Special.findByIdAndDelete(id)
        await Redemption.deleteMany({ special: id })

        return res.status(200).json({
            success: true,
            message: 'Special deleted successfully.',
            data: null,
        })
    } catch (error) {
        logger.error(`Delete Special Error: ${error.message}`)
        next(error)
    }
}

export const redeemSpecial = async (req, res, next) => {
    try {
        const { params, decoded } = req
        const { id } = params

        const special = await Special.findById(id).populate('business', 'user name status active')

        if (!special) {
            return res.status(404).json({
                success: false,
                message: 'Special not found.',
            })
        }

        if (!special.is_active || special.expires_at <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'This special is no longer available.',
            })
        }

        if (!special.business || special.business.status !== BUSINESS_STATUS.APPROVED || !special.business.active) {
            return res.status(400).json({
                success: false,
                message: 'This special is no longer available.',
            })
        }

        if (isSpecialOwner(special.business.user, decoded.id)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot redeem your own special.',
            })
        }

        const existing = await Redemption.findOne({ special: id, user: decoded.id })

        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'You have already redeemed this special.',
                data: existing.toObject({ virtuals: true }),
            })
        }

        let code = generateRedemptionCode()
        let attempts = 0

        while (attempts < 5) {
            const code_exists = await Redemption.exists({ code })
            if (!code_exists) break
            code = generateRedemptionCode()
            attempts += 1
        }

        const redemption = await Redemption.create({
            special: id,
            user: decoded.id,
            code,
            status: REDEMPTION_STATUS.ACTIVE,
            expires_at: special.expires_at,
        })

        logger.info(`Special redeemed: special=${id} user=${decoded.id}`)

        return res.status(201).json({
            success: true,
            message: 'Special redeemed successfully.',
            data: redemption.toObject({ virtuals: true }),
        })
    } catch (error) {
        if (error?.code === 11000) {
            const existing = await Redemption.findOne({ special: req.params.id, user: req.decoded.id })
            if (existing) {
                return res.status(200).json({
                    success: true,
                    message: 'You have already redeemed this special.',
                    data: existing.toObject({ virtuals: true }),
                })
            }
        }

        logger.error(`Redeem Special Error: ${error.message}`)
        next(error)
    }
}

export const getMyRedemptions = async (req, res, next) => {
    try {
        const { decoded, query } = req
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = { user: decoded.id }

        const redemption_query = Redemption.find(filter)
            .populate({
                path: 'special',
                populate: populateBusiness,
            })
            .sort({ createdAt: -1 })

        if (skip !== null && limit !== null) {
            redemption_query.skip(skip).limit(limit)
        }

        const [redemptions, total] = await Promise.all([
            redemption_query.lean({ virtuals: true }),
            Redemption.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'Redemptions fetched successfully.',
            ...buildPaginationResponse(redemptions, total, page, page_size),
        })
    } catch (error) {
        logger.error(`Get My Redemptions Error: ${error.message}`)
        next(error)
    }
}

export const useRedemptionCode = async (req, res, next) => {
    try {
        const { params, decoded } = req
        const code = String(params.code || '').trim().toUpperCase()

        const redemption = await Redemption.findOne({ code }).populate({
            path: 'special',
            populate: { path: 'business', select: 'user name' },
        })

        if (!redemption) {
            return res.status(404).json({
                success: false,
                message: 'Redemption code not found.',
            })
        }

        const business_user = redemption.special?.business?.user

        if (!isSpecialOwner(business_user, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        if (redemption.status === REDEMPTION_STATUS.USED) {
            return res.status(400).json({
                success: false,
                message: 'This code has already been used.',
            })
        }

        if (redemption.status === REDEMPTION_STATUS.EXPIRED || redemption.expires_at <= new Date()) {
            redemption.status = REDEMPTION_STATUS.EXPIRED
            await redemption.save()
            return res.status(400).json({
                success: false,
                message: 'This code has expired.',
            })
        }

        redemption.status = REDEMPTION_STATUS.USED
        redemption.redeemed_at = new Date()
        await redemption.save()

        return res.status(200).json({
            success: true,
            message: 'Redemption code marked as used.',
            data: redemption.toObject({ virtuals: true }),
        })
    } catch (error) {
        logger.error(`Use Redemption Code Error: ${error.message}`)
        next(error)
    }
}
