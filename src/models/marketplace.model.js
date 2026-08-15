import mongoose from 'mongoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'
import { ENUM_MARKETPLACE_STATUS, getMarketplaceExpiryDate, getMediaUrl, MARKETPLACE_STATUS } from '../utils/index.js'

const marketplace_schema = mongoose.Schema({
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
    description: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductCategory',
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    image: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ENUM_MARKETPLACE_STATUS,
        default: MARKETPLACE_STATUS.ACTIVE,
    },
    active: {
        type: Boolean,
        default: true,
    },
    expires_at: {
        type: Date,
        required: true,
        default: getMarketplaceExpiryDate,
    },
}, {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

marketplace_schema.virtual('image_url').get(function () {
    return getMediaUrl(this.image)
})

marketplace_schema.virtual('formatted_price').get(function () {

    if (this.price === null || this.price === undefined) return null

    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(this.price)

})

marketplace_schema.index({ user: 1, createdAt: -1 })
marketplace_schema.index({ category: 1, status: 1, active: 1 })
marketplace_schema.index({ status: 1, active: 1, expires_at: 1, createdAt: -1 })
marketplace_schema.index({ name: 'text', description: 'text' })

marketplace_schema.plugin(mongooseLeanVirtuals)

const Marketplace = mongoose.model('Marketplace', marketplace_schema)

export default Marketplace
