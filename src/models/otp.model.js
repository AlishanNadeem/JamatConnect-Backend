import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const otp_schema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    code: {
        type: String,
        required: true
    },
    expiry: {
        type: Date,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const Otp = mongoose.model('Otp', otp_schema)

export default Otp