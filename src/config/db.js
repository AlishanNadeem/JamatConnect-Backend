import mongoose from 'mongoose'
import logger from './logger.js'

const connectDB = async () => {
    try {

        const db_name = process.env.DB_NAME,
            connection_url = process.env.DB_CONNECTION_URL

         if (!connection_url || !db_name) {
            throw new Error('Database connection url or database name not defined in environment variables')
        }

        await mongoose.connect(connection_url, { dbName: db_name })

        logger.info(`Database connected to ${db_name} successfully`)

    } catch (error) {
        logger.error(`Error connecting to database: ${error.message}`)
        process.exit(1)
    }
}

export default connectDB