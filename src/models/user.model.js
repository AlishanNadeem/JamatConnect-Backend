import dotenv from 'dotenv'
import mongoose from 'mongoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'
import { encryptData } from '../helpers/encryption.js'
import { AUTH_TYPES, DUMMY_USER_IMAGE_PATH, ENUM_AUTH_TYPES, ENUM_ROLES, getMediaUrl, ROLES } from '../utils/index.js'

dotenv.config()

const user_schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function () {
            return this.auth_provider === AUTH_TYPES.EMAIL
        }
    },
    image: {
        type: String,
        default: DUMMY_USER_IMAGE_PATH
    },
    country_code: {
        type: String,
    },
    dialing_code: {
        type: String,
    },
    phone: {
        type: String,
        trim: true
    },
    device_ids: [{
        type: String
    }],
    role: {
        type: String,
        enum: ENUM_ROLES,
        default: ROLES.USER
    },
    active: {
        type: Boolean,
        required: true,
        default: true
    },
    auth_provider: {
        type: String,
        enum: ENUM_AUTH_TYPES,
        default: AUTH_TYPES.EMAIL
    },
    provider_id: {
        type: String,
        required: function () {
            return this.auth_provider !== AUTH_TYPES.EMAIL
        }
    },
}, {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

user_schema.pre('save', (async function (next) {

    if (this.isModified('password')) {
        let encrypted_password = await encryptData(this.password)
        this.password = encrypted_password
    }

    return next()

}))

user_schema.pre('findOneAndUpdate', (async function (next) {

    if (this._update.password) {
        let encrypted_password = await encryptData(this._update.password)
        this._update.password = encrypted_password
    }

    return next()

}))

user_schema.virtual('image_url').get(function () {
    return getMediaUrl(this.image)
})

user_schema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })

user_schema.plugin(mongooseLeanVirtuals)

const User = mongoose.model('User', user_schema)

export default User