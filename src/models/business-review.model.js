import mongoose from 'mongoose'

const business_review_schema = mongoose.Schema({
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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
}, {
    id: false,
    timestamps: true,
})

business_review_schema.index({ business: 1, user: 1 }, { unique: true })
business_review_schema.index({ business: 1, createdAt: -1 })

const BusinessReview = mongoose.model('BusinessReview', business_review_schema)

export default BusinessReview
