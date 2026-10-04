import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'
import logger from './logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const service_account_path = join(__dirname, 'jamat-connect-ea783-2e9e2558e232.json')

let messaging = null

try {
    const service_account = JSON.parse(readFileSync(service_account_path, 'utf8'))

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(service_account),
        })
    }

    messaging = admin.messaging()
    logger.info('Firebase Admin initialized for push notifications')
} catch (error) {
    logger.error(`Firebase Admin init failed: ${error.message}`)
}

export const getMessaging = () => {
    if (!messaging) {
        throw new Error('Firebase messaging is not initialized')
    }
    return messaging
}

export default admin
