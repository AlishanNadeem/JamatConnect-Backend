import mongoose from 'mongoose'
import { ENUM_NOTIFICATION_TYPES, NOTIFICATION_TYPES } from '../utils/index.js'

const notification_schema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    body: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ENUM_NOTIFICATION_TYPES,
        default: NOTIFICATION_TYPES.GENERAL,
        index: true,
    },
    data: {
        type: Map,
        of: String,
        default: {},
    },
    is_read: {
        type: Boolean,
        default: false,
        index: true,
    },
    read_at: {
        type: Date,
        default: null,
    },
}, {
    id: false,
    timestamps: true,
})

notification_schema.index({ user: 1, createdAt: -1 })
notification_schema.index({ user: 1, is_read: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notification_schema)

export default Notification
