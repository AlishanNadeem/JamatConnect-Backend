import express from 'express'
import {
    deleteNotification,
    getNotifications,
    getUnreadCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '../controllers/notification.controller.js'
import { AuthVerifier } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/get', AuthVerifier, getNotifications)
router.get('/get-unread-count', AuthVerifier, getUnreadCount)
router.patch('/mark-all-as-read', AuthVerifier, markAllNotificationsAsRead)
router.patch('/read/:id', AuthVerifier, markNotificationAsRead)
router.delete('/delete/:id', AuthVerifier, deleteNotification)

export default router
