import mongoose from 'mongoose'

const referral_schema = mongoose.Schema({
    referrer_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    referred_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    referral_code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
}, {
    timestamps: true,
})

referral_schema.index({ referred_user_id: 1 }, { unique: true })
referral_schema.index({ referrer_user_id: 1, createdAt: -1 })

const Referral = mongoose.model('Referral', referral_schema)

export default Referral
