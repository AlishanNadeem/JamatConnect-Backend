import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const DEFAULT_REVIEW_BASE_URL = 'https://jamatconnect.com/review/'
const REVIEW_TOKEN_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const generateReviewToken = (length = 12) => {
    return Array.from(
        { length },
        () => REVIEW_TOKEN_CHARSET[crypto.randomInt(0, REVIEW_TOKEN_CHARSET.length)]
    ).join('')
}

export const getReviewLink = (review_token) => {
    if (!review_token) return null
    const base_url = process.env.REVIEW_BASE_URL || DEFAULT_REVIEW_BASE_URL
    return `${base_url}${review_token}`
}

export const normalizeReviewToken = (input) => {
    if (!input || typeof input !== 'string') return ''

    let token = input.trim()
    const review_index = token.toLowerCase().indexOf('/review/')

    if (review_index !== -1) {
        token = token.slice(review_index + '/review/'.length)
    }

    token = token.split('?')[0].split('#')[0].replace(/\/+$/, '')

    return token.trim().toUpperCase()
}
