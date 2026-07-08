import logger from '../config/logger.js'
import { compareData } from '../helpers/encryption.js'
import { removeFiles } from '../helpers/folder.js'
import User from '../models/user.model.js'
import { DUMMY_USER_IMAGE_PATH } from '../utils/index.js'

export const completeProfile = async (req, res, next) => {
    try {

        const { body, decoded } = req

        const {
            date_of_birth,
            country_code,
            dialing_code,
            phone,
            emergency_notes,
        } = body

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
            .select("-password")
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