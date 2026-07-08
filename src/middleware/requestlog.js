import morgan from 'morgan'
import logger from '../config/logger.js'

const stream = {
    write: (message) => logger.http(message.trim()),
}

const requestLog = morgan('dev', { stream })

export default requestLog