import User from '../models/user.model.js'
import Referral from '../models/referral.model.js'
import { normalizeCode, REFERRAL_INVALID_REASONS } from '../helpers/referral.js'

export const resolveReferralCode = async (input) => {

    const referral_code = normalizeCode(input)

    if (!referral_code) {
        return { valid: false, reason: REFERRAL_INVALID_REASONS.NOT_FOUND }
    }

    const referrer = await User.findOne({ 'referral.code': referral_code })

    if (!referrer) {
        return { valid: false, reason: REFERRAL_INVALID_REASONS.NOT_FOUND }
    }

    if (!referrer.referral?.active || !referrer.active) {
        return { valid: false, reason: REFERRAL_INVALID_REASONS.REVOKED }
    }

    return { valid: true, referrer }

}

export const recordReferral = async ({ referrer_user_id, referred_user_id, referral_code }) => {

    const existing = await Referral.findOne({ referred_user_id })

    if (existing) {
        throw new Error('Referral record already exists for this user.')
    }

    const referral = new Referral({
        referrer_user_id,
        referred_user_id,
        referral_code: normalizeCode(referral_code),
    })

    await referral.save()

    return referral

}
