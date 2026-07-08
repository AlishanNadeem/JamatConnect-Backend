import mongoose from "mongoose";

const referral_schema = new mongoose.Schema({
    code: {
        type: String,
        trim: true,
        uppercase: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
}, { _id: false })

export default referral_schema