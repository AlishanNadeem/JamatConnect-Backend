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

export const DUMMY_USER_IMAGE_PATH = "uploads/user/dummy.jpg"

export const ROLES = {
    ADMIN: "admin",
    USER: "user"
}

export const ENUM_ROLES = Object.values(ROLES)

export const getMediaUrl = (path) => {

    if (!path) return null

    if (path.startsWith('http')) return path

    return `${process.env.BASE_URL}${path}`

}
