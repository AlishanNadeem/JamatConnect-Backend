import { readFileSync, existsSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging as getFirebaseMessaging } from 'firebase-admin/messaging'
import logger from './logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_SERVICE_ACCOUNT_PATH = join(__dirname, 'jamat-connect-ea783-2e9e2558e232.json')

let messaging = null

const loadServiceAccount = () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    }

    const service_account_path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        ? resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : DEFAULT_SERVICE_ACCOUNT_PATH

    if (!existsSync(service_account_path)) {
        throw new Error(
            `Firebase service account file not found at ${service_account_path}. ` +
            'Upload the JSON to the server, or set FIREBASE_SERVICE_ACCOUNT / FIREBASE_SERVICE_ACCOUNT_PATH.'
        )
    }

    return JSON.parse(readFileSync(service_account_path, 'utf8'))
}

try {
    const service_account = loadServiceAccount()

    if (typeof service_account.private_key === 'string') {
        service_account.private_key = service_account.private_key.replace(/\\n/g, '\n')
    }

    if (!getApps().length) {
        initializeApp({
            credential: cert(service_account),
        })
    }

    messaging = getFirebaseMessaging()
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

export default { getMessaging }
