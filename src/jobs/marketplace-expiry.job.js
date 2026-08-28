import cron from 'node-cron'
import logger from '../config/logger.js'
import Marketplace from '../models/marketplace.model.js'

const expireListings = async () => {
    try {

        const result = await Marketplace.updateMany(
            {
                is_expired: false,
                expires_at: { $lte: new Date() },
            },
            { $set: { is_expired: true } }
        )

        logger.info(`Marketplace expiry job: ${result.modifiedCount} listing(s) expired.`)

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
