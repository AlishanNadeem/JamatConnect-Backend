import logger from '../config/logger.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import Notification from '../models/notification.model.js'

export const getNotifications = async (req, res, next) => {
    try {
        const { decoded, query } = req
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = { user: decoded.id }

        if (query.is_read !== undefined) {
            filter.is_read = query.is_read === 'true' || query.is_read === true
        }

        if (query.type) {
            filter.type = query.type
        }

        const notification_query = Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        const [notifications, count] = await Promise.all([
            notification_query.lean(),
            Notification.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'Notifications fetched successfully.',
            ...buildPaginationResponse(notifications, count, page, page_size),
        })
    } catch (error) {
        logger.error(`Get Notifications Error: ${error.message}`)
        next(error)
    }
}

export const getUnreadCount = async (req, res, next) => {
    try {
        const { decoded } = req

        const count = await Notification.countDocuments({
            user: decoded.id,
            is_read: false,
        })

        return res.status(200).json({
            success: true,
            message: 'Unread notification count fetched successfully.',
            data: { count },
        })
    } catch (error) {
        logger.error(`Get Unread Count Error: ${error.message}`)
        next(error)
    }
}

export const markNotificationAsRead = async (req, res, next) => {
    try {
        const { decoded, params } = req
        const { id } = params

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: decoded.id },
            {
                $set: {
                    is_read: true,
                    read_at: new Date(),
                },
            },
            { new: true }
        )

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read.',
            data: notification,
        })
    } catch (error) {
        logger.error(`Mark Notification As Read Error: ${error.message}`)
        next(error)
    }
}

export const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        const { decoded } = req

        const result = await Notification.updateMany(
            { user: decoded.id, is_read: false },
            {
                $set: {
                    is_read: true,
                    read_at: new Date(),
                },
            }
        )

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read.',
            data: { modified_count: result.modifiedCount },
        })
    } catch (error) {
        logger.error(`Mark All Notifications As Read Error: ${error.message}`)
        next(error)
    }
}

export const deleteNotification = async (req, res, next) => {
    try {
        const { decoded, params } = req
        const { id } = params

        const notification = await Notification.findOneAndDelete({
            _id: id,
            user: decoded.id,
        })

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Notification deleted successfully.',
        })
    } catch (error) {
        logger.error(`Delete Notification Error: ${error.message}`)
        next(error)
    }
}
