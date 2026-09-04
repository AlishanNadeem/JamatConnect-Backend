import mongoose from 'mongoose'
import { ENUM_EMPLOYMENT_TYPES, ENUM_WORKPLACE_TYPES } from '../utils/index.js'

const job_schema = mongoose.Schema({
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
    employment_type: {
        type: String,
        enum: ENUM_EMPLOYMENT_TYPES,
        required: true,
    },
    workplace_type: {
        type: String,
        enum: ENUM_WORKPLACE_TYPES,
        required: true,
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    closed: {
        type: Boolean,
        default: false,
    },
}, {
    id: false,
    timestamps: true,
})

job_schema.index({ business: 1, createdAt: -1 })
job_schema.index({ employment_type: 1, workplace_type: 1, closed: 1 })
job_schema.index({ title: 'text', description: 'text' })

const Job = mongoose.model('Job', job_schema)

export default Job
