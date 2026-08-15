import { encryptData } from "../helpers/encryption.js"
import crypto from 'crypto'

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export const AUTH_TYPES = {
    EMAIL: "email",
    GOOGLE: "google",
    APPLE: "apple",
}

export const ENUM_AUTH_TYPES = Object.values(AUTH_TYPES)

export const GENDERS = {
    MALE: "male",
    FEMALE: "female",
    OTHER: "other"
}

export const ENUM_GENDERS = Object.values(GENDERS)

export const generatePassword = (length = 16) => {
    return Array.from(
        { length },
        () => CHARSET[crypto.randomInt(0, CHARSET.length)]
    ).join('')
}

export const generateOtp = async (length = 6) => {

    if (length < 4 || length > 10) {
        throw new Error('OTP length must be between 4 and 10 digits')
    }

    const otp = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
    const hashed = await encryptData(otp)

    return { otp, hashed }

}

export const searchRegex = (text, exact = false) => {

    if (!text) return /.*/

    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const pattern = exact ? `^${escaped}$` : escaped

    return new RegExp(pattern, 'i')

}

export const buildDateRangeQuery = (from_date, to_date) => {

    if (!from_date && !to_date) return undefined

    const condition = {}

    if (from_date) condition['$gte'] = new Date(from_date)
    if (to_date) condition['$lte'] = new Date(to_date)

    return condition

}

export const DUMMY_USER_IMAGE_PATH = "uploads/user/dummy.jpg"

export const ROLES = {
    ADMIN: "admin",
    USER: "user"
}

export const ENUM_ROLES = Object.values(ROLES)

export const isAdmin = (role) => role === ROLES.ADMIN

export const LOGIN_LOG_EVENTS = {
    LOGIN_SUCCESS: "login_success",
    LOGIN_FAILED: "login_failed",
    LOGOUT: "logout",
}

export const ENUM_LOGIN_LOG_EVENTS = Object.values(LOGIN_LOG_EVENTS)

export const LOGIN_FAILURE_REASONS = {
    INVALID_CREDENTIALS: "invalid_credentials",
    INACTIVE: "inactive",
    UNAUTHORIZED: "unauthorized",
}

export const ENUM_LOGIN_FAILURE_REASONS = Object.values(LOGIN_FAILURE_REASONS)

export const BUSINESS_STATUS = {
    DRAFT: "draft",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
}

export const ENUM_BUSINESS_STATUS = Object.values(BUSINESS_STATUS)

export const BUSINESS_DAYS = {
    MONDAY: "monday",
    TUESDAY: "tuesday",
    WEDNESDAY: "wednesday",
    THURSDAY: "thursday",
    FRIDAY: "friday",
    SATURDAY: "saturday",
    SUNDAY: "sunday",
}

export const ENUM_BUSINESS_DAYS = Object.values(BUSINESS_DAYS)

export const MARKETPLACE_STATUS = {
    ACTIVE: "active",
    EXPIRED: "expired",
    SOLD: "sold",
}

export const ENUM_MARKETPLACE_STATUS = Object.values(MARKETPLACE_STATUS)

export const MARKETPLACE_LISTING_DAYS = 30

export const getMarketplaceExpiryDate = () => {
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + MARKETPLACE_LISTING_DAYS)
    expires_at.setHours(0, 0, 0, 0)
    return expires_at
}

export const getMediaUrl = (path) => {

    if (!path) return null

    const normalized_path = path.replace(/\\/g, '/')

    if (normalized_path.startsWith('http')) return normalized_path

    return `${process.env.BASE_URL}${normalized_path}`

}
