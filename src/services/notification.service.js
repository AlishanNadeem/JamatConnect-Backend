import logger from '../config/logger.js'
import { getMessaging } from '../config/firebase.js'
import Notification from '../models/notification.model.js'
import User from '../models/user.model.js'
import { NOTIFICATION_TYPES } from '../utils/index.js'

const INVALID_TOKEN_CODES = new Set([
    'messaging/invalid-registration-token',
    'messaging/registration-token-not-registered',
])

const toStringData = (data = {}) =>
    Object.entries(data).reduce((acc, [key, value]) => {
        if (value === undefined || value === null) return acc
        acc[key] = typeof value === 'string' ? value : String(value)
        return acc
    }, {})

const removeInvalidTokens = async (tokens = []) => {
    if (!tokens.length) return

    await User.updateMany(
        { fcm_tokens: { $in: tokens } },
        { $pull: { fcm_tokens: { $in: tokens } } }
    )

    logger.info(`Removed ${tokens.length} invalid FCM token(s)`)
}

const saveNotifications = async ({
    user_ids = [],
    title,
    body,
    type = NOTIFICATION_TYPES.GENERAL,
    data = {},
}) => {
    const unique_ids = [...new Set(user_ids.filter(Boolean))]

    if (!unique_ids.length || !title || !body) return []

    const payload_data = toStringData(data)

    const docs = unique_ids.map((user_id) => ({
        user: user_id,
        title,
        body,
        type,
        data: payload_data,
    }))

    try {
        return await Notification.insertMany(docs, { ordered: false })
    } catch (error) {
        logger.error(`Save notifications error: ${error.message}`)
        return []
    }
}

export const sendPushToTokens = async ({
    tokens = [],
    title,
    body,
    data = {},
}) => {
    const unique_tokens = [...new Set(tokens.filter(Boolean))]

    if (!unique_tokens.length) {
        return { success_count: 0, failure_count: 0 }
    }

    if (!title || !body) {
        logger.error('FCM send skipped: title and body are required')
        return { success_count: 0, failure_count: unique_tokens.length, error: 'title and body are required' }
    }

    try {
        const messaging = getMessaging()

        const response = await messaging.sendEachForMulticast({
            tokens: unique_tokens,
            notification: { title, body },
            data: toStringData(data),
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                    },
                },
            },
        })

        const invalid_tokens = []

        response.responses.forEach((result, index) => {
            if (result.success) return

            const code = result.error?.code
            logger.error(`FCM send failed (${unique_tokens[index]}): ${result.error?.message}`)

            if (INVALID_TOKEN_CODES.has(code)) {
                invalid_tokens.push(unique_tokens[index])
            }
        })

        if (invalid_tokens.length) {
            await removeInvalidTokens(invalid_tokens)
        }

        return {
            success_count: response.successCount,
            failure_count: response.failureCount,
        }
    } catch (error) {
        logger.error(`FCM multicast error: ${error.message}`)
        return { success_count: 0, failure_count: unique_tokens.length, error: error.message }
    }
}

export const sendPushToUser = async ({
    user_id,
    title,
    body,
    data = {},
    type = NOTIFICATION_TYPES.GENERAL,
    save = true,
}) => {
    try {
        if (!user_id) {
            return { success_count: 0, failure_count: 0 }
        }

        if (save) {
            await saveNotifications({
                user_ids: [user_id],
                title,
                body,
                type,
                data,
            })
        }

        const user = await User.findById(user_id).select('fcm_tokens').lean()
        const tokens = user?.fcm_tokens || []

        return await sendPushToTokens({
            tokens,
            title,
            body,
            data: {
                ...data,
                type,
            },
        })
    } catch (error) {
        logger.error(`FCM sendPushToUser error: ${error.message}`)
        return { success_count: 0, failure_count: 0, error: error.message }
    }
}

export const sendPushToUsers = async ({
    user_ids = [],
    title,
    body,
    data = {},
    type = NOTIFICATION_TYPES.GENERAL,
    save = true,
}) => {
    try {
        const unique_ids = [...new Set(user_ids.filter(Boolean))]

        if (!unique_ids.length) {
            return { success_count: 0, failure_count: 0 }
        }

        if (save) {
            await saveNotifications({
                user_ids: unique_ids,
                title,
                body,
                type,
                data,
            })
        }

        const users = await User.find({ _id: { $in: unique_ids } })
            .select('fcm_tokens')
            .lean()

        const tokens = users.flatMap((user) => user.fcm_tokens || [])

        return await sendPushToTokens({
            tokens,
            title,
            body,
            data: {
                ...data,
                type,
            },
        })
    } catch (error) {
        logger.error(`FCM sendPushToUsers error: ${error.message}`)
        return { success_count: 0, failure_count: 0, error: error.message }
    }
}

export const sendPushToAllUsers = async ({
    title,
    body,
    data = {},
    type = NOTIFICATION_TYPES.GENERAL,
    save = true,
}) => {
    try {
        const users = await User.find({
            fcm_tokens: { $exists: true, $ne: [] },
        })
            .select('_id fcm_tokens')
            .lean()

        if (!users.length) {
            return { success_count: 0, failure_count: 0 }
        }

        if (save) {
            await saveNotifications({
                user_ids: users.map((user) => user._id),
                title,
                body,
                type,
                data,
            })
        }

        const tokens = users.flatMap((user) => user.fcm_tokens || [])

        return await sendPushToTokens({
            tokens,
            title,
            body,
            data: {
                ...data,
                type,
            },
        })
    } catch (error) {
        logger.error(`FCM sendPushToAllUsers error: ${error.message}`)
        return { success_count: 0, failure_count: 0, error: error.message }
    }
}
