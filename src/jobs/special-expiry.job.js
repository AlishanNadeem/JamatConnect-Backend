import cron from 'node-cron'
import logger from '../config/logger.js'
import Special from '../models/special.model.js'
import Redemption from '../models/redemption.model.js'
import { REDEMPTION_STATUS } from '../utils/index.js'

const expireSpecials = async () => {
    const now = new Date()

    const result = await Special.updateMany(
        {
            is_active: true,
            expires_at: { $lte: now },
        },
        {
            $set: { is_active: false },
        }
    )

    logger.info(`Special expiry job: ${result.modifiedCount || 0} special(s) deactivated.`)
}

const expireRedemptions = async () => {
    const now = new Date()

    const result = await Redemption.updateMany(
        {
            status: REDEMPTION_STATUS.ACTIVE,
            expires_at: { $lte: now },
        },
        {
            $set: { status: REDEMPTION_STATUS.EXPIRED },
        }
    )

    logger.info(`Redemption expiry job: ${result.modifiedCount || 0} redemption(s) expired.`)
}

const runSpecialExpiryJobs = async () => {
    try {
        await expireSpecials()
        await expireRedemptions()
    } catch (error) {
        logger.error(`Special expiry job error: ${error.message}`)
    }
}

export const startSpecialExpiryJob = () => {
    cron.schedule('0 0 * * *', runSpecialExpiryJobs, {
        timezone: 'UTC',
    })

    logger.info('Special expiry cron scheduled for 00:00 UTC daily.')
}
