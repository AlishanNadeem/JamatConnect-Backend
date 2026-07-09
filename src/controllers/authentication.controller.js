import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import logger from '../config/logger.js'
import { compareData } from '../helpers/encryption.js'
import { removeFiles } from '../helpers/folder.js'
import { REFERRAL_INVALID_REASONS } from '../helpers/referral.js'
import { sendMail } from '../helpers/mail.js'
import { generateToken, verifyToken } from '../helpers/token.js'
import Otp from '../models/otp.model.js'
import User from '../models/user.model.js'
import { recordLoginLog } from '../services/log.service.js'
import { recordReferral, resolveReferralCode } from '../services/referral.service.js'
import { AUTH_TYPES, generateOtp, LOGIN_FAILURE_REASONS, LOGIN_LOG_EVENTS, ROLES } from '../utils/index.js'

dotenv.config()

export const signup = async (req, res, next) => {

    const uploaded_image = req.file?.path
    let user_saved = false

    const cleanupUploadedImage = () => {
        if (uploaded_image && !user_saved) {
            removeFiles(uploaded_image)
        }
    }

    try {

        const { body, file } = req

        const {
            name,
            email,
            password,
            referral_code,
        } = body

        const exists = await User.findOne({ email }).collation({ locale: 'en', strength: 2 })

        if (exists) {
            cleanupUploadedImage()
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email.',
            })
        }

        const referral_result = await resolveReferralCode(referral_code)

        if (!referral_result.valid) {
            const message = referral_result.reason === REFERRAL_INVALID_REASONS.REVOKED
                ? 'This referral code is no longer active.'
                : 'Invalid referral code.'

            cleanupUploadedImage()

            return res.status(400).json({
                success: false,
                message,
            })
        }

        const { referrer } = referral_result

        if (referrer.email.toLowerCase() === email.toLowerCase()) {
            cleanupUploadedImage()
            return res.status(400).json({
                success: false,
                message: 'You cannot use your own referral code.',
            })
        }

        let payload = {
            name,
            email,
            password,
            referred_by_user: referrer._id,
        }

        if (file && file.path) {
            payload.image = file.path
        }

        const user = new User(payload)
        await user.save()
        user_saved = true

        await recordReferral({
            referrer_user_id: referrer._id,
            referred_user_id: user._id,
            referral_code,
        })

        const token = await generateToken({
            id: user._id,
            email: user.email,
            role: user.role,
            type: 'login'
        })

        logger.info(`User registered successfully: ${email}`)

        const user_data = user.toObject({ virtuals: true })
        delete user_data.password

        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: {
                user: user_data,
                token
            },
        })

    } catch (error) {
        cleanupUploadedImage()
        next(error)
    }
}

export const socialLogin = async (req, res, next) => {
    try {

        const { access_token, type, source, device_id } = req.body

        let email = null
        let name = null
        let image = null
        let provider_id = null

        if (type === AUTH_TYPES.GOOGLE) {

            const response = await fetch(
                `https://oauth2.googleapis.com/tokeninfo?id_token=${access_token}`
            )
            const data = await response.json()

            if (data.error) {
                return res.status(401).json({ success: false, message: 'Invalid Google Token' })
            }

            email = data.email
            name = data.name
            image = data.picture
            provider_id = data.sub

        } else if (type === AUTH_TYPES.APPLE) {

            const decoded = jwt.decode(access_token, { complete: true })

            if (!decoded || !decoded.payload) {
                return res.status(401).json({ success: false, message: 'Invalid Apple Token' })
            }

            email = decoded.payload.email
            provider_id = decoded.payload.sub
            name = decoded.payload.email ? decoded.payload.email.split('@')[0] : 'Apple User'

        } else {
            return res.status(400).json({ success: false, message: 'Unsupported auth type' })
        }

        let user = await User.findOne({
            $or: [{ provider_id }, { email }],
        })

        if (!user) {

            user = await User.create({
                name,
                email,
                image,
                auth_provider: type,
                provider_id,
                role: source || ROLES.USER,
            })

            logger.info(`New ${type} user created: ${email}`)

        } else {

            if (!user.provider_id) {
                user.provider_id = provider_id
                user.auth_provider = type
            }

        }

        if (device_id && !user.device_ids.includes(device_id)) {
            user.device_ids.push(device_id)
            await user.save()
        }

        const token = await generateToken({
            id: user._id,
            email: user.email,
            role: user.role,
            type: 'login',
        })

        logger.info(`User logged in via ${type}: ${email}`)

        const user_data = user.toObject({ virtuals: true })
        delete user_data.password

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                user: user_data,
                token
            },
        })

    } catch (error) {
        logger.error(`Social Login Error: ${error.message}`)
        next(error)
    }
}

export const login = async (req, res, next) => {
    try {

        const { email, password, device_id, source } = req.body
        const login_source = source || ROLES.USER

        const user = await User.findOne({ email })
            .collation({ locale: 'en', strength: 2 })

        if (!user) {
            recordLoginLog({
                req,
                email,
                event: LOGIN_LOG_EVENTS.LOGIN_FAILED,
                source: login_source,
                failure_reason: LOGIN_FAILURE_REASONS.INVALID_CREDENTIALS,
                device_id,
            })

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            })
        }

        if (!user.active) {
            recordLoginLog({
                req,
                user,
                email,
                event: LOGIN_LOG_EVENTS.LOGIN_FAILED,
                source: login_source,
                failure_reason: LOGIN_FAILURE_REASONS.INACTIVE,
                device_id,
            })

            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.',
            })
        }

        const matched = await compareData(password, user.password)

        if (!matched) {
            recordLoginLog({
                req,
                user,
                email,
                event: LOGIN_LOG_EVENTS.LOGIN_FAILED,
                source: login_source,
                failure_reason: LOGIN_FAILURE_REASONS.INVALID_CREDENTIALS,
                device_id,
            })

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            })
        }

        if (
            (login_source === ROLES.ADMIN && user.role !== ROLES.ADMIN) ||
            (login_source === ROLES.USER && user.role === ROLES.ADMIN)
        ) {
            recordLoginLog({
                req,
                user,
                email,
                event: LOGIN_LOG_EVENTS.LOGIN_FAILED,
                source: login_source,
                failure_reason: LOGIN_FAILURE_REASONS.UNAUTHORIZED,
                device_id,
            })

            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        if (device_id && !user.device_ids.includes(device_id)) {
            user.device_ids.push(device_id)
            await user.save()
        }

        const token = await generateToken({
            id: user._id,
            email: user.email,
            role: user.role,
            type: 'login'
        })

        logger.info(`User logged in: ${email}`)

        recordLoginLog({
            req,
            user,
            email,
            event: LOGIN_LOG_EVENTS.LOGIN_SUCCESS,
            source: login_source,
            device_id,
        })

        const user_data = user.toObject({ virtuals: true })
        delete user_data.password

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                user: user_data,
                token,
            },
        })

    } catch (error) {
        logger.error(`Login Error: ${error.message}`)
        next(error)
    }
}

export const forgetPassword = async (req, res, next) => {
    try {

        const { email } = req.body

        const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email.',
            })
        }

        await Otp.deleteMany({ user: user._id })

        const { hashed, otp } = await generateOtp()
        const expiry = new Date(Date.now() + 10 * 60 * 1000)

        await Otp.create({
            user: user._id,
            code: hashed,
            expiry
        })

        logger.info(`OTP generated successfully by ${user.name}`)

        await sendMail({
            to: user.email,
            subject: "Password Reset Request – JamatConnect",
            template: "password_reset_code",
            template_vars: {
                name: user.name,
                verification_code: otp,
                app_name: "JamatConnect",
                logo_url: `${process.env.BASE_URL}uploads/logo.png`
            }
        })

        return res.status(200).json({
            success: true,
            message: 'OTP generated successfully and has been sent to email.',
            data: {
                email
            },
        })

    } catch (error) {
        logger.error(`Forget Password Error: ${error.message}`)
        next(error)
    }
}

export const verifyOtp = async (req, res, next) => {
    try {

        const { body } = req
        const { email, otp } = body

        const user = await User.findOne({ email }).collation({ locale: 'en', strength: 2 })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email.',
            })
        }

        const otp_data = await Otp.findOne({ user: user._id, verified: false })

        if (!otp_data) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP.',
            })
        }

        if (otp_data.expiry < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired.'
            })
        }

        const matched = await compareData(otp, otp_data.code)
        if (!matched) return res.status(400).json({
            success: false,
            message: 'Invalid OTP.'
        })

        otp_data.verified = true
        await otp_data.save()

        const token = await generateToken({ id: user._id, type: 'password_reset' }, '15m')

        logger.info(`OTP verified successfully by ${user.name}`)

        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully.',
            data: {
                token
            },
        })

    } catch (error) {
        logger.error(`Verify OTP Error: ${error.message}`)
        next(error)
    }
}

export const setPassword = async (req, res, next) => {
    try {

        const { body, headers } = req
        const { password } = body

        const auth_header = headers.authorization

        if (!auth_header)
            return res.status(401).json({ success: false, message: 'Missing token' })

        if (!auth_header?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Missing token'

            })
        }

        const token = auth_header.split(' ')[1]

        const decoded = await verifyToken(token)

        if (decoded.type !== 'password_reset') {
            return res.status(400).json({
                success: false,
                message: 'Invalid token type'
            })
        }

        const user = await User.findById(decoded.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            })
        }

        user.password = password
        await user.save()

        await Otp.deleteMany({ user: decoded._id })

        logger.info(`Password set successfully by ${user.name}`)

        return res.status(200).json({
            success: true,
            message: 'Password set successful.'
        })

    } catch (error) {
        logger.error(`Set Password Error: ${error.message}`)
        next(error)
    }
}

export const logout = async (req, res, next) => {
    try {

        const { decoded, body } = req
        let device_id = null

        if (body) {
            device_id = body?.device_id
        }

        const user = await User.findById(decoded.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        if (device_id && user?.device_ids.includes(device_id)) {
            user.device_ids = user.device_ids.filter(id => id !== device_id)
            await user.save()
        }

        logger.info(`User logged out: ${user.email}`)

        recordLoginLog({
            req,
            user,
            email: user.email,
            event: LOGIN_LOG_EVENTS.LOGOUT,
            source: user.role,
            device_id,
        })

        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        })

    } catch (error) {
        logger.error(`Logout Error: ${error.message}`)
        next(error)
    }

}