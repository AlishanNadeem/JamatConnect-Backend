import logger from '../config/logger.js'
import { compareData } from '../helpers/encryption.js'
import { removeFiles } from '../helpers/folder.js'
import { sendMail } from '../helpers/mail.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import { generateReferralCode } from '../helpers/referral.js'
import LoginLog from '../models/login-log.model.js'
import User from '../models/user.model.js'
import { AUTH_TYPES, DUMMY_USER_IMAGE_PATH, generatePassword, LOGIN_LOG_EVENTS, ROLES, searchRegex } from '../utils/index.js'

const USER_PUBLIC_SELECT = '-password -fcm_tokens -device_ids'

const sanitizeUser = (user) => {
    if (!user) return user
    const data = typeof user.toObject === 'function'
        ? user.toObject({ virtuals: true })
        : user
    delete data.password
    delete data.fcm_tokens
    delete data.device_ids
    return data
}

export const completeProfile = async (req, res, next) => {
    try {

        const { body, decoded } = req

        const user = await User.findByIdAndUpdate(
            decoded.id,
            { $set: body },
            { new: true, runValidators: true }
        )

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            })
        }

        logger.info(`User profile completed: ${user.email}`)

        return res.status(200).json({
            success: true,
            message: 'Profile completed successfully.',
            data: user,
        })

    } catch (error) {
        logger.error(`Complete Profile Error: ${error.message}`)
        next(error)
    }
}

export const getMyProfile = async (req, res, next) => {

    try {
        const { decoded } = req

        const user = await User.findById(decoded.id)
            .select(USER_PUBLIC_SELECT)
            .lean({ virtuals: true })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            })
        }

        logger.info(`Profile fetched for user: ${user.email}`)

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully.",
            data: user,
        })

    } catch (error) {
        logger.error(`Get Profile Error: ${error.message}`)
        next(error)
    }
}

export const changePassword = async (req, res, next) => {
    try {

        const { decoded, body } = req
        const { old_password, new_password } = body

        const user = await User.findById(decoded.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            })
        }

        const matched = await compareData(old_password, user.password)

        if (!matched) {
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect.",
            })
        }

        user.password = new_password
        await user.save()

        logger.info(`Password changed successfully for: ${user.email}`)

        return res.status(200).json({
            success: true,
            message: "Password changed successfully.",
        })

    } catch (error) {
        logger.error(`Change Password Error: ${error.message}`)
        next(error)
    }
}

export const updateProfile = async (req, res, next) => {
    try {

        const { decoded, body, file } = req
        const { name, country_code, dialing_code, phone, date_of_birth, emergency_notes } = body

        let user = await User.findById(decoded.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            })
        }

        const updated_fields = {}
        if (name) updated_fields.name = name
        if (country_code) updated_fields.country_code = country_code
        if (dialing_code) updated_fields.dialing_code = dialing_code
        if (phone) updated_fields.phone = phone
        if (date_of_birth) updated_fields.date_of_birth = date_of_birth
        if (emergency_notes) updated_fields.emergency_notes = emergency_notes
        if (file && file.path) {
            if (user?.image && user?.image !== DUMMY_USER_IMAGE_PATH) removeFiles(user?.image)
            updated_fields.image = file.path
        }

        user = await User.findByIdAndUpdate(
            decoded.id,
            { $set: updated_fields },
            { new: true, runValidators: true }
        )

        logger.info(`Profile updated successfully for: ${user.email}`)

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: { user }
        })

    } catch (error) {
        logger.error(`Update Profile Error: ${error.message}`)
        next(error)
    }
}

export const deleteAccount = async (req, res, next) => {
    try {

        const { decoded } = req

        const user = await User.findByIdAndDelete(decoded.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            })
        }

        if (user.image && user.image !== DUMMY_USER_IMAGE_PATH) {
            await removeFiles(user.image)
        }

        logger.info(`Account deleted successfully for: ${user.email}`)

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully.",
        })

    } catch (error) {
        logger.error(`Delete Account Error: ${error.message}`)
        next(error)
    }
}

export const registerFcmToken = async (req, res, next) => {
    try {
        const { decoded, body } = req
        const { fcm_token } = body

        const user = await User.findByIdAndUpdate(
            decoded.id,
            { $addToSet: { fcm_tokens: fcm_token } },
            { new: true }
        ).select('_id email')

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            })
        }

        logger.info(`FCM token registered for: ${user.email}`)

        return res.status(200).json({
            success: true,
            message: 'FCM token registered successfully.',
        })
    } catch (error) {
        logger.error(`Register FCM Token Error: ${error.message}`)
        next(error)
    }
}

export const removeFcmToken = async (req, res, next) => {
    try {
        const { decoded, body } = req
        const { fcm_token } = body

        const user = await User.findByIdAndUpdate(
            decoded.id,
            { $pull: { fcm_tokens: fcm_token } },
            { new: true }
        ).select('_id email')

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            })
        }

        logger.info(`FCM token removed for: ${user.email}`)

        return res.status(200).json({
            success: true,
            message: 'FCM token removed successfully.',
        })
    } catch (error) {
        logger.error(`Remove FCM Token Error: ${error.message}`)
        next(error)
    }
}

export const getUsers = async (req, res, next) => {
    try {
        const { query } = req
        const { search, role, active } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = {}

        if (role !== undefined) filter.role = role
        if (active !== undefined) filter.active = active === true || active === 'true'

        if (search !== undefined && String(search).trim()) {
            const regex = searchRegex(String(search).trim())
            filter.$or = [
                { name: regex },
                { email: regex },
                { phone: regex },
            ]
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select(USER_PUBLIC_SELECT)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean({ virtuals: true }),
            User.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'Users fetched successfully.',
            ...buildPaginationResponse(users, total, page, page_size),
        })
    } catch (error) {
        logger.error(`Get Users Error: ${error.message}`)
        next(error)
    }
}

export const getUserById = async (req, res, next) => {
    try {
        const { params } = req
        const { id } = params

        const user = await User.findById(id)
            .select('-password -device_ids')
            .populate({
                path: 'referred_by_user',
                select: 'name email',
            })
            .lean({ virtuals: true })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            })
        }

        const last_login_log = await LoginLog.findOne({
            user: id,
            event: LOGIN_LOG_EVENTS.LOGIN_SUCCESS,
        })
            .sort({ createdAt: -1 })
            .select('createdAt method source')
            .lean()

        const [referred_users, referred_count] = await Promise.all([
            User.find({ referred_by_user: id })
                .select('name email createdAt image')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean({ virtuals: true }),
            User.countDocuments({ referred_by_user: id }),
        ])

        const push_notifications_enabled = Array.isArray(user.fcm_tokens) && user.fcm_tokens.length > 0
        delete user.fcm_tokens

        return res.status(200).json({
            success: true,
            message: 'User fetched successfully.',
            data: {
                ...user,
                push_notifications_enabled,
                referred_count,
                referred_users,
                last_login: last_login_log
                    ? {
                        at: last_login_log.createdAt,
                        method: last_login_log.method,
                        source: last_login_log.source,
                    }
                    : null,
            },
        })
    } catch (error) {
        logger.error(`Get User Error: ${error.message}`)
        next(error)
    }
}

export const createUser = async (req, res, next) => {

    const uploaded_image = req.file?.path

    const cleanupUploadedImage = () => {
        if (uploaded_image) removeFiles(uploaded_image)
    }

    try {
        const { decoded, body, file } = req
        const {
            name,
            email,
            password,
            country_code,
            dialing_code,
            phone,
            active = true,
            send_invite = true,
        } = body

        if (body.role && body.role !== ROLES.USER) {
            cleanupUploadedImage()
            return res.status(400).json({
                success: false,
                message: 'Admins can only create user accounts.',
            })
        }

        const exists = await User.findOne({ email }).collation({ locale: 'en', strength: 2 })

        if (exists) {
            cleanupUploadedImage()
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email.',
            })
        }

        const plain_password = password || generatePassword(12)

        const payload = {
            name,
            email,
            password: plain_password,
            role: ROLES.USER,
            active,
            auth_provider: AUTH_TYPES.EMAIL,
            is_seed: true,
        }

        if (country_code) payload.country_code = country_code
        if (dialing_code) payload.dialing_code = dialing_code
        if (phone) payload.phone = phone
        if (file?.path) payload.image = file.path

        const user = new User(payload)
        await user.save()

        if (send_invite) {
            try {
                await sendMail({
                    to: user.email,
                    subject: 'Welcome to Jamat Connect — your login details',
                    template: 'admin_user_invite',
                    template_vars: {
                        name: user.name,
                        email: user.email,
                        password: plain_password,
                        app_name: 'Jamat Connect',
                        logo_url: `${process.env.BASE_URL}uploads/logo.png`,
                    },
                })
            } catch (mail_error) {
                logger.error(`Create User invite email failed: ${mail_error.message}`)
            }
        }

        logger.info(`User created by admin ${decoded.email}: ${user.email}`)

        const data = await User.findById(user._id)
            .select(USER_PUBLIC_SELECT)
            .lean({ virtuals: true })

        return res.status(201).json({
            success: true,
            message: 'User created successfully.',
            data,
        })
    } catch (error) {
        cleanupUploadedImage()
        logger.error(`Create User Error: ${error.message}`)
        next(error)
    }
}

export const toggleUserActive = async (req, res, next) => {
    try {
        const { decoded, params } = req
        const { id } = params

        const user = await User.findById(id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            })
        }

        if (String(decoded.id) === String(id)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own account status.',
            })
        }

        user.active = !user.active
        await user.save()

        try {

            const is_active = user.active

            await sendMail({
                to: user.email,
                subject: is_active
                    ? 'Your Jamat Connect account is active again'
                    : 'Your Jamat Connect account is inactive',
                template: is_active ? 'admin_user_activated' : 'admin_user_deactivated',
                template_vars: {
                    name: user.name,
                    email: user.email,
                    app_name: 'Jamat Connect',
                    logo_url: `${process.env.BASE_URL}uploads/logo.png`,
                },
            })

        } catch (mail_error) {
            logger.error(`User status email failed: ${mail_error.message}`)
        }

        const data = await User.findById(user._id)
            .select(USER_PUBLIC_SELECT)
            .lean({ virtuals: true })

        logger.info(
            `User active toggled by admin ${decoded.email}: ${user.email} (${user.active})`
        )

        return res.status(200).json({
            success: true,
            message: user.active
                ? 'User activated successfully.'
                : 'User deactivated successfully.',
            data: sanitizeUser(data),
        })
    } catch (error) {
        logger.error(`Toggle User Active Error: ${error.message}`)
        next(error)
    }
}

export const toggleUserReferral = async (req, res, next) => {
    try {
        const { decoded, params } = req
        const { id } = params

        const user = await User.findById(id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            })
        }

        if (!user.referral?.code) {
            return res.status(400).json({
                success: false,
                message: 'This user does not have a referral code.',
            })
        }

        user.referral.active = !user.referral.active
        await user.save()

        const data = await User.findById(user._id)
            .select(USER_PUBLIC_SELECT)
            .populate({
                path: 'referred_by_user',
                select: 'name email',
            })
            .lean({ virtuals: true })

        logger.info(
            `User referral toggled by admin ${decoded.email}: ${user.email} (${user.referral.active})`
        )

        return res.status(200).json({
            success: true,
            message: user.referral.active
                ? 'Referral code activated successfully.'
                : 'Referral code deactivated successfully.',
            data: sanitizeUser(data),
        })
    } catch (error) {
        logger.error(`Toggle User Referral Error: ${error.message}`)
        next(error)
    }
}

export const regenerateUserReferral = async (req, res, next) => {
    try {
        const { decoded, params } = req
        const { id } = params

        const user = await User.findById(id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            })
        }

        if (user.role !== ROLES.USER) {
            return res.status(400).json({
                success: false,
                message: 'Only user accounts can have a referral code.',
            })
        }

        let exists = true
        let new_code = null

        while (exists) {
            new_code = generateReferralCode()
            exists = await User.exists({
                'referral.code': new_code,
                _id: { $ne: user._id },
            })
        }

        const was_active = user.referral?.active ?? true

        user.referral = {
            code: new_code,
            active: was_active,
        }

        await user.save()

        const data = await User.findById(user._id)
            .select(USER_PUBLIC_SELECT)
            .populate({
                path: 'referred_by_user',
                select: 'name email',
            })
            .lean({ virtuals: true })

        logger.info(
            `User referral regenerated by admin ${decoded.email}: ${user.email} -> ${new_code}`
        )

        return res.status(200).json({
            success: true,
            message: 'Referral code regenerated successfully.',
            data: sanitizeUser(data),
        })
    } catch (error) {
        logger.error(`Regenerate User Referral Error: ${error.message}`)
        next(error)
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        const { decoded, params } = req
        const { id } = params

        if (String(decoded.id) === String(id)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account.',
            })
        }

        const user = await User.findByIdAndDelete(id)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            })
        }

        if (user.image && user.image !== DUMMY_USER_IMAGE_PATH) {
            removeFiles(user.image)
        }

        logger.info(`User deleted by admin ${decoded.email}: ${user.email}`)

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully.',
        })
    } catch (error) {
        logger.error(`Delete User Error: ${error.message}`)
        next(error)
    }
}
