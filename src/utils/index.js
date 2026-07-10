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

export const getMediaUrl = (path) => {

    if (!path) return null

    if (path.startsWith('http')) return path

    return `${process.env.BASE_URL}${path}`

}
