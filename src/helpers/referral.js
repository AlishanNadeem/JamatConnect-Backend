import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const REFERRAL_CODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const DEFAULT_REFERRAL_BASE_URL = 'https://jamatconnect.com/invite/'

export const REFERRAL_INVALID_REASONS = {
    NOT_FOUND: 'not_found',
    REVOKED: 'revoked',
}

export const normalizeCode = (input) => {

    if (!input || typeof input !== 'string') return ''

    let code = input.trim()

    const invite_index = code.toLowerCase().indexOf('/invite/')
    if (invite_index !== -1) {
        code = code.slice(invite_index + '/invite/'.length)
    }

    code = code.split('?')[0].split('#')[0].replace(/\/+$/, '')

    return code.trim().toUpperCase()

}

export const generateReferralCode = (length = 8) => {

    return Array.from(
        { length },
        () => REFERRAL_CODE_CHARSET[crypto.randomInt(0, REFERRAL_CODE_CHARSET.length)]
    ).join('')

}

export const getReferralLink = (referral_code) => {

    if (!referral_code) return null

    const base_url = process.env.REFERRAL_BASE_URL || DEFAULT_REFERRAL_BASE_URL

    return `${base_url}${referral_code}`

}
