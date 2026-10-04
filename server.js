import dotenv from 'dotenv'
import app from './src/app.js'
import connectDB from './src/config/db.js'
import './src/config/firebase.js'
import logger from './src/config/logger.js'
import { makeFolders } from './src/helpers/folder.js'
import { startMarketplaceExpiryJob } from './src/jobs/marketplace-expiry.job.js'
import { sendPushToAllUsers } from './src/services/notification.service.js'

dotenv.config()

const PORT = process.env.PORT || 8080

const sendStartupTestPush = async () => {
    // TODO: remove after push notification testing
    const result = await sendPushToAllUsers({
        title: 'Jamat Connect',
        body: 'Push notification test from server startup.',
        data: { type: 'startup_test' },
    })

    logger.info(
        `Startup test push sent. success=${result.success_count} failure=${result.failure_count}`
    )
}

const serverHandler = async () => {
    try {

        logger.info(`Server started 🚀 Running on port ${PORT}.`)

        await connectDB()
        makeFolders()
        startMarketplaceExpiryJob()
        await sendStartupTestPush()

    } catch (e) {
        logger.error("Error while connecting server :: ", e)
        process.exit(1)
    }
}

app.listen(PORT, serverHandler)
