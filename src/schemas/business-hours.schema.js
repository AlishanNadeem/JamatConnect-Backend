import mongoose from 'mongoose'
import { ENUM_BUSINESS_DAYS } from '../utils/index.js'

const business_hours_schema = new mongoose.Schema({
    day: {
        type: String,
        enum: ENUM_BUSINESS_DAYS,
        required: true,
    },
    open: {
        type: String,
        trim: true,
        default: null,
    },
    close: {
        type: String,
        trim: true,
        default: null,
    },
    closed: {
        type: Boolean,
        default: false,
    },
}, { _id: false })

export default business_hours_schema
