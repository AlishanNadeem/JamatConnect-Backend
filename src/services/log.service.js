import logger from '../config/logger.js'
import LoginLog from '../models/login-log.model.js'
import { AUTH_TYPES, ROLES } from '../utils/index.js'

export const recordLoginLog = async ({
    req,
    user = null,
    email,
    event,
    method = AUTH_TYPES.EMAIL,
    source = ROLES.USER,
    failure_reason = null,
    device_id = null,
}) => {

    let ip = null
    let user_agent = null

    if (req) {
        const forwarded = req.headers['x-forwarded-for']

        if (typeof forwarded === 'string') {
            ip = forwarded.split(',')[0]?.trim() || null
        } else if (Array.isArray(forwarded) && forwarded.length) {
            ip = forwarded[0]?.trim() || null
        }

        ip = ip || req.ip || null
        user_agent = req.get?.('user-agent') || req.headers?.['user-agent'] || null
    }

    const user_id = user?._id ?? user ?? null

    try {

        await LoginLog.create({
            user: user_id,
            email: email.trim().toLowerCase(),
            event,
            method,
            source,
            failure_reason,
            ip,
            user_agent,
            device_id,
        })

    } catch (error) {
        logger.error(`Login log error: ${error.message}`)
    }

}
