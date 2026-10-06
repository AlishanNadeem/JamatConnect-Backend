import crypto from 'crypto'
import Redemption from '../models/redemption.model.js'
import { REDEMPTION_STATUS } from '../utils/index.js'

const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const REDEMPTION_VALIDITY_DAYS = 3

export const generateRedemptionCode = async (length = 8) => {
    let code
    let attempts = 0

    do {
        code = Array.from(
            { length },
            () => CODE_CHARSET[crypto.randomInt(0, CODE_CHARSET.length)],
        ).join('')
        attempts++
    } while (await Redemption.exists({ code }) && attempts < 20)

    if (attempts >= 20) {
        throw new Error('Unable to generate a unique redemption code.')
    }

    return code
}

export const getRedemptionExpiryDate = (from = new Date()) => {
    const expires_at = new Date(from)
    expires_at.setDate(expires_at.getDate() + REDEMPTION_VALIDITY_DAYS)
    return expires_at
}

export const isRedemptionExpired = (redemption, now = new Date()) => {
    if (!redemption) return false
    if (redemption.status === REDEMPTION_STATUS.EXPIRED) return true
    if (redemption.status === REDEMPTION_STATUS.ACTIVE && new Date(redemption.expires_at) <= now) {
        return true
    }
    return false
}

export const expireRedemptionIfNeeded = async (redemption, now = new Date()) => {
    if (!redemption) return null

    if (redemption.status !== REDEMPTION_STATUS.ACTIVE) {
        return redemption
    }

    if (new Date(redemption.expires_at) > now) {
        return redemption
    }

    const updated = await Redemption.findOneAndUpdate(
        {
            _id: redemption._id,
            status: REDEMPTION_STATUS.ACTIVE,
        },
        {
            $set: { status: REDEMPTION_STATUS.EXPIRED },
        },
        { new: true },
    )

    return updated ?? redemption
}
