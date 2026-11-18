import mongoose from 'mongoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'
import { getSpecialExpiryDate } from '../utils/index.js'

const special_schema = mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    discount: {
        type: String,
        required: true,
        trim: true,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    expires_at: {
        type: Date,
        required: true,
        default: getSpecialExpiryDate,
    },
}, {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

special_schema.virtual('is_expired').get(function () {
    return this.expires_at ? this.expires_at.getTime() <= Date.now() : false
})

special_schema.virtual('editable').get(function () {
    if (!this.createdAt) return false
    const window_ms = 24 * 60 * 60 * 1000
    return Date.now() - this.createdAt.getTime() <= window_ms
})

special_schema.index({ business: 1, createdAt: -1 })
special_schema.index({ is_active: 1, expires_at: 1, createdAt: -1 })
special_schema.index({ business: 1, is_active: 1 })

special_schema.plugin(mongooseLeanVirtuals)

const Special = mongoose.model('Special', special_schema)

export default Special
