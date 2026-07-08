import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'

import logger from './config/logger.js'
import { errorHandler } from './middleware/error.js'
import requestLogger from './middleware/requestlog.js'
import routes from './routes/index.js'

dotenv.config()

const app = express()

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
)
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use('/uploads', express.static(path.join(__dirname, "../uploads")));
app.use(`/${process.env.APP_NAME}/v1/api`, routes)
app.get('/health', (req, res) => res.status(200).send('OK'))

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' })
})

app.use(errorHandler)

process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`)
    process.exit(1)
})

process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`)
})

export default app
