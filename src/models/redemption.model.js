import mongoose from 'mongoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'
import { ENUM_REDEMPTION_STATUS, REDEMPTION_STATUS } from '../utils/index.js'

const redemption_schema = mongoose.Schema({
    special: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Special',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    status: {
        type: String,
        enum: ENUM_REDEMPTION_STATUS,
        default: REDEMPTION_STATUS.ACTIVE,
    },
    expires_at: {
        type: Date,
        required: true,
    },
    redeemed_at: {
        type: Date,
        default: null,
    },
}, {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

redemption_schema.index({ code: 1 }, { unique: true })
redemption_schema.index({ special: 1, user: 1 }, { unique: true })
redemption_schema.index({ special: 1, status: 1, createdAt: -1 })
redemption_schema.index({ user: 1, status: 1 })
redemption_schema.index({ status: 1, expires_at: 1 })

redemption_schema.plugin(mongooseLeanVirtuals)

const Redemption = mongoose.model('Redemption', redemption_schema)

export default Redemption
