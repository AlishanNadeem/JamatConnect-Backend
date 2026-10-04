import cron from 'node-cron'
import logger from '../config/logger.js'
import Marketplace from '../models/marketplace.model.js'
import { sendPushToUser } from '../services/notification.service.js'

const expireListings = async () => {
    try {

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
                data: {
                    type: 'marketplace_expired',
                    listing_id: String(listing._id),
                },
            })

        }

        logger.info(`Marketplace expiry job: ${expired_listings.length} listing(s) expired.`)

    } catch (error) {
        logger.error(`Marketplace expiry job error: ${error.message}`)
    }
}

export const startMarketplaceExpiryJob = () => {

    cron.schedule('0 0 * * *', expireListings, {
        timezone: 'UTC',
    })

    logger.info('Marketplace expiry cron scheduled for 00:00 UTC daily.')

}
