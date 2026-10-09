import mongoose from 'mongoose'

const feedback_schema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    is_read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
})

feedback_schema.index({ createdAt: -1 })
feedback_schema.index({ is_read: 1, createdAt: -1 })
feedback_schema.index({ email: 1 })

const Feedback = mongoose.model('Feedback', feedback_schema)

export default Feedback
