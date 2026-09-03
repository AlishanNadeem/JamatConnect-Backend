import mongoose from 'mongoose'

const job_application_schema = mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
    },
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    id: false,
    timestamps: true,
})

job_application_schema.index({ job: 1, applicant: 1 }, { unique: true })
job_application_schema.index({ business: 1, createdAt: -1 })
job_application_schema.index({ job: 1, createdAt: -1 })

const JobApplication = mongoose.model('JobApplication', job_application_schema)

export default JobApplication
