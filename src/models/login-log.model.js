import mongoose from 'mongoose'
import {
    AUTH_TYPES,
    ENUM_AUTH_TYPES,
    ENUM_LOGIN_FAILURE_REASONS,
    ENUM_LOGIN_LOG_EVENTS,
    ENUM_ROLES,
    ROLES,
} from '../utils/index.js'

const login_log_schema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    event: {
        type: String,
        enum: ENUM_LOGIN_LOG_EVENTS,
        required: true,
    },
    method: {
        type: String,
        enum: ENUM_AUTH_TYPES,
        default: AUTH_TYPES.EMAIL,
    },
    source: {
        type: String,
        enum: ENUM_ROLES,
        default: ROLES.USER,
    },
    failure_reason: {
        type: String,
        enum: ENUM_LOGIN_FAILURE_REASONS,
        default: null,
    },
    ip: {
        type: String,
        trim: true,
        default: null,
    },
    user_agent: {
        type: String,
        trim: true,
        default: null,
    },
    device_id: {
        type: String,
        trim: true,
        default: null,
    },
}, {
    timestamps: true,
})

login_log_schema.index({ user: 1, createdAt: -1 })
login_log_schema.index({ email: 1, createdAt: -1 })
login_log_schema.index({ event: 1, createdAt: -1 })

const LoginLog = mongoose.model('LoginLog', login_log_schema)

export default LoginLog
