import { AUTH_TYPES } from '../utils/index.js'

export const getPasswordResetBlock = (user) => {

    if (!user.active) {
        return {
            status: 403,
            message: 'Your account has been deactivated. Please contact support.',
        }
    }

    if (user.auth_provider !== AUTH_TYPES.EMAIL) {
        return {
            status: 400,
            message: 'Password reset is not available for social login accounts.',
        }
    }

    return null

}
