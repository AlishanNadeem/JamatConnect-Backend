import mongoose from 'mongoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'
import address_schema from '../schemas/address.schema.js'
import business_hours_schema from '../schemas/business-hours.schema.js'
import { BUSINESS_STATUS, ENUM_BUSINESS_STATUS, getMediaUrl } from '../utils/index.js'

const business_schema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusinessCategory',
        required: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    country_code: {
        type: String,
        required: true,
        trim: true,
    },
    dialing_code: {
        type: String,
        required: true,
        trim: true,
    },
    website: {
        type: String,
        trim: true,
    },
    address: {
        type: address_schema,
        required: true,
    },
    hours: {
        type: [business_hours_schema],
        default: [],
    },
    logo: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
        trim: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ENUM_BUSINESS_STATUS,
        default: BUSINESS_STATUS.PENDING,
    },
    active: {
        type: Boolean,
        default: true,
    },
    featured: {
        type: Boolean,
        default: false,
    },
    rejection_reason: {
        type: String,
        trim: true,
        default: null,
    },
    approved_at: {
        type: Date,
        default: null,
    },
    approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

business_schema.virtual('logo_url').get(function () {
    return getMediaUrl(this.logo)
})

business_schema.virtual('image_url').get(function () {
    return getMediaUrl(this.image)
})

business_schema.index({ user: 1, createdAt: -1 })
business_schema.index({ slug: 1 }, { unique: true })
business_schema.index({ category: 1, status: 1, active: 1 })
business_schema.index({ status: 1, active: 1, featured: -1, createdAt: -1 })
business_schema.index({ 'address.city': 1, status: 1, active: 1 })
business_schema.index({ name: 'text', description: 'text' })

business_schema.plugin(mongooseLeanVirtuals)

const Business = mongoose.model('Business', business_schema)

export default Business
