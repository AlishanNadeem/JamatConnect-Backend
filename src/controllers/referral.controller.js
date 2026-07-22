import logger from '../config/logger.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import Referral from '../models/referral.model.js'

export const getMyReferredUsers = async (req, res, next) => {
    try {

        const { decoded, query } = req
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = { referrer_user: decoded.id }

        const referral_query = Referral.find(filter)
            .populate('referred_user', 'name email image createdAt')
            .sort({ createdAt: -1 })
            .skip(skip).limit(limit)

        const [referrals, count] = await Promise.all([
            referral_query.lean({ virtuals: true }),
            Referral.countDocuments(filter),
        ])

        const users = referrals
            .filter((referral) => referral.referred_user)
            .map((referral) => ({
                name: referral.referred_user.name,
                email: referral.referred_user.email,
                image: referral.referred_user.image,
                image_url: referral.referred_user.image_url,
                joining_date: referral.referred_user.createdAt,
            }))

        return res.status(200).json({
            success: true,
            message: 'Referred users fetched successfully.',
            ...buildPaginationResponse(users, count, page, page_size)
        })

    } catch (error) {
        logger.error(`Get Referred Users Error: ${error.message}`)
        next(error)
    }
}
