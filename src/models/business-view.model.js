import mongoose from 'mongoose'

const business_view_schema = mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    id: false,
    timestamps: true,
})

business_view_schema.index({ business: 1, user: 1, date: 1 }, { unique: true })
business_view_schema.index({ business: 1, createdAt: -1 })

const BusinessView = mongoose.model('BusinessView', business_view_schema)

export default BusinessView
