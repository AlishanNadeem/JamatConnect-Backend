import dotenv from 'dotenv'
import mongoose from 'mongoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'
import { encryptData } from '../helpers/encryption.js'
import { generateReferralCode, getReferralLink } from '../helpers/referral.js'
import referral_schema from '../schemas/refferal.schema.js'
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
    referral: {
        type: referral_schema,
        default: null,
    },
    referred_by_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        required: function () {
            return !this.is_seed
        },
    },
    is_seed: {
        type: Boolean,
        default: false,
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

user_schema.pre('validate', function (next) {

    if (this.role === ROLES.ADMIN) {
        this.referral = null
    }

    if (this.is_seed && this.referred_by_user) {
        return next(new Error('Seed members cannot have a referrer.'))
    }

    next()

})

user_schema.pre('save', (async function (next) {

    if (this.isModified('password')) {
        let encrypted_password = await encryptData(this.password)
        this.password = encrypted_password
    }

    if (this.role === ROLES.USER && this.isNew && !this.referral?.code) {

        if (!this.referral) {
            this.referral = { active: true }
        }

        let exists = true

        while (exists) {
            const code = generateReferralCode()
            exists = await this.constructor.exists({ 'referral.code': code })

            if (!exists) {
                this.referral.code = code
            }
        }
    }

    return next()

}))

user_schema.pre('findOneAndUpdate', (async function (next) {

    const update = this.getUpdate()
    const $set = update?.$set ?? update

    if ($set?.password) {
        let encrypted_password = await encryptData($set.password)
        if (update.$set) update.$set.password = encrypted_password
        else update.password = encrypted_password
    }

    if ($set?.role === ROLES.ADMIN) {
        if (update.$set) update.$set.referral = null
        else if (update.$unset) update.$unset.referral = ''
        else update.referral = null
    }

    return next()

}))

user_schema.virtual('image_url').get(function () {
    return getMediaUrl(this.image)
})

user_schema.virtual('referral_link').get(function () {
    return getReferralLink(this.referral?.code)
})

user_schema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })
user_schema.index({ 'referral.code': 1 }, { unique: true, sparse: true })

user_schema.plugin(mongooseLeanVirtuals)

const User = mongoose.model('User', user_schema)

export default User
