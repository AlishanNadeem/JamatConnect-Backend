import cron from 'node-cron'
import logger from '../config/logger.js'
import Marketplace from '../models/marketplace.model.js'
import { sendPushToUser } from '../services/notification.service.js'
import { NOTIFICATION_TYPES } from '../utils/index.js'

const DAY_MS = 24 * 60 * 60 * 1000

const sendExpiryReminders = async () => {

    const now = new Date()
    const reminder_start = new Date(now.getTime() + (3 * DAY_MS))
    const reminder_end = new Date(now.getTime() + (4 * DAY_MS))

    const listings = await Marketplace.find({
        is_expired: false,
        expires_at: {
            $gte: reminder_start,
            $lt: reminder_end,
        },
    }).select('_id name user')

    if (!listings.length) {
        logger.info('Marketplace expiry reminder: no listings due in 3 days.')
        return
    }

    for (const listing of listings) {
        sendPushToUser({
            user_id: listing.user,
            title: 'Your listing expires in 3 days',
            body: `${listing.name} will expire soon. Renew it to keep it visible.`,
            type: NOTIFICATION_TYPES.MARKETPLACE_EXPIRY_REMINDER,
            data: {
                listing_id: String(listing._id),
            },
        })
    }

    logger.info(`Marketplace expiry reminder: ${listings.length} listing(s) notified.`)

}

const expireListings = async () => {

    const expired_listings = await Marketplace.find({
        is_expired: false,
        expires_at: { $lte: new Date() },
    }).select('_id name user')

    if (!expired_listings.length) {
        logger.info('Marketplace expiry job: no listings to expire.')
        return
    }

    const ids = expired_listings.map((listing) => listing._id)

    await Marketplace.updateMany(
        { _id: { $in: ids } },
        { $set: { is_expired: true } }
    )

    for (const listing of expired_listings) {
        sendPushToUser({
            user_id: listing.user,
            title: 'Your listing has expired',
            body: `${listing.name} is no longer visible. Renew it anytime to keep it live.`,
            type: NOTIFICATION_TYPES.MARKETPLACE_EXPIRED,
            data: {
                listing_id: String(listing._id),
            },
        })
    }

    logger.info(`Marketplace expiry job: ${expired_listings.length} listing(s) expired.`)

}

const runMarketplaceExpiryJobs = async () => {
    try {
        await sendExpiryReminders()
        await expireListings()
    } catch (error) {
        logger.error(`Marketplace expiry job error: ${error.message}`)
    }
}

export const startMarketplaceExpiryJob = () => {

    cron.schedule('0 0 * * *', runMarketplaceExpiryJobs, {
        timezone: 'UTC',
    })

    logger.info('Marketplace expiry cron scheduled for 00:00 UTC daily.')

}
