import logger from '../config/logger.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import Business from '../models/business.model.js'
import JobApplication from '../models/job-application.model.js'
import Job from '../models/job.model.js'
import { isBusinessOwner } from '../services/business.service.js'
import { isJobOwner } from '../services/job.service.js'
import { BUSINESS_STATUS, isAdmin, searchRegex } from '../utils/index.js'

export const createJob = async (req, res, next) => {
    try {

        const { body, decoded } = req
        const { business, title, description, employment_type, workplace_type, location } = body

        const business_doc = await Business.findById(business)

        if (!business_doc) {
            return res.status(404).json({
                success: false,
                message: 'Business not found.',
            })
        }

        if (!isBusinessOwner(business_doc, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        if (business_doc.status !== BUSINESS_STATUS.APPROVED || !business_doc.active) {
            return res.status(400).json({
                success: false,
                message: 'Business must be approved and active to post jobs.',
            })
        }

        let job = new Job({
            business,
            title,
            description,
            employment_type,
            workplace_type,
            location,
        })

        await job.save()
        job = job.toObject()

        logger.info(`Job created: ${job.title}`)

        return res.status(201).json({
            success: true,
            message: 'Job created successfully.',
            data: job,
        })

    } catch (error) {
        logger.error(`Create Job Error: ${error.message}`)
        next(error)
    }
}

export const getJobs = async (req, res, next) => {
    try {

        const { query, decoded } = req
        const { business, employment_type, workplace_type, search } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = {
            active: true,
            closed: false,
        }

        if (employment_type) filter.employment_type = employment_type
        if (workplace_type) filter.workplace_type = workplace_type
        if (search) filter.title = searchRegex(search)

        if (business) {

            const business_exists = await Business.exists({ _id: business, status: BUSINESS_STATUS.APPROVED, active: true })

            if (!business_exists) {
                return res.status(200).json({
                    success: true,
                    message: 'Jobs fetched successfully.',
                    ...buildPaginationResponse([], 0, page, page_size),
                })
            }

            filter.business = business

        } else {
            const approved_business_ids = await Business.find({ status: BUSINESS_STATUS.APPROVED, active: true }).distinct('_id')
            filter.business = { $in: approved_business_ids }
        }

        const job_query = Job.find(filter)
            .select('title employment_type workplace_type location business createdAt')
            .populate('business', 'name logo')
            .sort({ createdAt: -1 })

        if (skip !== null && limit !== null) {
            job_query.skip(skip).limit(limit)
        }

        const [jobs, total] = await Promise.all([
            job_query.lean({ virtuals: true }),
            Job.countDocuments(filter),
        ])

        const job_ids = jobs.map((job) => job._id)
        const applied_job_ids = job_ids.length
            ? await JobApplication.find({
                job: { $in: job_ids },
                applicant: decoded.id,
            }).distinct('job')
            : []

        const applied_job_id_set = new Set(applied_job_ids.map((job_id) => job_id.toString()))

        const data = jobs.map((job) => ({
            ...job,
            applied: applied_job_id_set.has(job._id.toString()),
        }))

        return res.status(200).json({
            success: true,
            message: 'Jobs fetched successfully.',
            ...buildPaginationResponse(data, total, page, page_size),
        })

    } catch (error) {
        logger.error(`Get Jobs Error: ${error.message}`)
        next(error)
    }
}

export const getMyJobs = async (req, res, next) => {
    try {

        const { decoded, query } = req
        const { business, employment_type, workplace_type, active, closed, search } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const owned_business_ids = await Business.find({ user: decoded.id }).distinct('_id')

        const filter = { business: { $in: owned_business_ids } }

        if (business) {

            if (!owned_business_ids.some((owned_id) => owned_id.toString() === business)) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized.',
                })
            }

            filter.business = business

        }

        if (employment_type) filter.employment_type = employment_type
        if (workplace_type) filter.workplace_type = workplace_type
        if (active !== undefined) filter.active = active
        if (closed !== undefined) filter.closed = closed
        if (search) filter.title = searchRegex(search)

        const job_query = Job.find(filter)
            .select('title description employment_type workplace_type location business active closed createdAt')
            .populate('business', 'name logo')
            .sort({ createdAt: -1 })

        if (skip !== null && limit !== null) {
            job_query.skip(skip).limit(limit)
        }

        const [jobs, total] = await Promise.all([
            job_query.lean({ virtuals: true }),
            Job.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'My jobs fetched successfully.',
            ...buildPaginationResponse(jobs, total, page, page_size),
        })

    } catch (error) {
        logger.error(`Get My Jobs Error: ${error.message}`)
        next(error)
    }
}

export const getJobById = async (req, res, next) => {
    try {

        const { decoded, params, query } = req
        const { id } = params
        const show_similar_jobs = String(query.show_similar_jobs).toLowerCase() === 'true'

        const job = await Job.findById(id)
            .populate({
                path: 'business',
                select: 'name slug logo image phone dialing_code email address description category status active user',
                populate: {
                    path: 'category',
                    select: 'name',
                },
            })
            .lean({ virtuals: true })

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.',
            })
        }

        const is_owner = decoded?.id && job.business?.user?.toString() === decoded.id
        const is_admin = isAdmin(decoded?.role)
        const is_public = job.active && !job.closed && job.business?.status === BUSINESS_STATUS.APPROVED && job.business?.active

        if (!is_owner && !is_admin && !is_public) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.',
            })
        }

        let similar_jobs = []

        if (show_similar_jobs) {

            const approved_business_ids = await Business.find({
                status: BUSINESS_STATUS.APPROVED,
                active: true,
            }).distinct('_id')

            similar_jobs = await Job.find({
                _id: { $ne: job._id },
                active: true,
                closed: false,
                business: { $in: approved_business_ids },
                $or: [
                    { employment_type: job.employment_type },
                    { workplace_type: job.workplace_type },
                ],
            })
                .select('title employment_type workplace_type location business createdAt')
                .populate('business', 'name logo')
                .sort({ createdAt: -1 })
                .limit(3)
                .lean({ virtuals: true })
        }

        const job_ids = [
            job._id,
            ...similar_jobs.map((similar_job) => similar_job._id),
        ]

        const applied_job_ids = decoded?.id
            ? await JobApplication.find({
                job: { $in: job_ids },
                applicant: decoded.id,
            }).distinct('job')
            : []

        const applied_job_id_set = new Set(applied_job_ids.map((job_id) => job_id.toString()))

        return res.status(200).json({
            success: true,
            message: 'Job fetched successfully.',
            data: {
                ...job,
                applied: applied_job_id_set.has(job._id.toString()),
            },
            ...(show_similar_jobs
                ? {
                    similar_jobs: similar_jobs.map((similar_job) => ({
                        ...similar_job,
                        applied: applied_job_id_set.has(similar_job._id.toString()),
                    })),
                }
                : {}),
        })

    } catch (error) {
        logger.error(`Get Job Error: ${error.message}`)
        next(error)
    }
}

export const updateJob = async (req, res, next) => {
    try {

        const { body, params, decoded } = req
        const { id } = params

        const job = await Job.findById(id).populate('business', 'user')

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.',
            })
        }

        if (!isJobOwner(job, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        const {
            title,
            description,
            employment_type,
            workplace_type,
            location,
            active,
            closed,
        } = body

        const updated_fields = {}

        if (title !== undefined) updated_fields.title = title
        if (description !== undefined) updated_fields.description = description
        if (employment_type !== undefined) updated_fields.employment_type = employment_type
        if (workplace_type !== undefined) updated_fields.workplace_type = workplace_type
        if (location !== undefined) updated_fields.location = location
        if (active !== undefined) updated_fields.active = active
        if (closed !== undefined) updated_fields.closed = closed

        const updated_job = await Job.findByIdAndUpdate(
            id,
            { $set: updated_fields },
            { new: true, runValidators: true, lean: true }
        )

        logger.info(`Job updated: ${updated_job.title}`)

        return res.status(200).json({
            success: true,
            message: 'Job updated successfully.',
            data: updated_job,
        })

    } catch (error) {
        logger.error(`Update Job Error: ${error.message}`)
        next(error)
    }
}

export const toggleJobActive = async (req, res, next) => {
    try {

        const { params, decoded } = req
        const { id } = params

        const job = await Job.findById(id).populate('business', 'user')

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.',
            })
        }

        if (!isJobOwner(job, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        job.active = !job.active
        await job.save()
        job.depopulate('business')

        logger.info(`Job active toggled: ${job.title} (${job.active})`)

        return res.status(200).json({
            success: true,
            message: job.active ? 'Job activated successfully.' : 'Job deactivated successfully.',
            data: job.toObject(),
        })

    } catch (error) {
        logger.error(`Toggle Job Active Error: ${error.message}`)
        next(error)
    }
}

export const deleteJob = async (req, res, next) => {
    try {

        const { params, decoded } = req
        const { id } = params

        const job = await Job.findById(id).populate('business', 'user')

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.',
            })
        }

        if (!isJobOwner(job, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        await Promise.all([
            Job.findByIdAndDelete(id),
            JobApplication.deleteMany({ job: id }),
        ])

        logger.info(`Job deleted: ${job.title}`)

        return res.status(200).json({
            success: true,
            message: 'Job deleted successfully.',
        })

    } catch (error) {
        logger.error(`Delete Job Error: ${error.message}`)
        next(error)
    }
}

export const applyToJob = async (req, res, next) => {
    try {

        const { params, decoded } = req
        const { id } = params

        const job = await Job.findById(id).populate('business', 'user status active')

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.',
            })
        }

        if (!job.active || job.closed) {
            return res.status(400).json({
                success: false,
                message: 'This job is not accepting applications.',
            })
        }

        if (!job.business || job.business.status !== BUSINESS_STATUS.APPROVED || !job.business.active) {
            return res.status(400).json({
                success: false,
                message: 'This job is not accepting applications.',
            })
        }

        if (isBusinessOwner(job.business, decoded.id)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot apply to your own job.',
            })
        }

        const existing = await JobApplication.exists({ job: id, applicant: decoded.id })

        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'You have already applied to this job.',
            })
        }

        const application = await JobApplication.create({
            job: id,
            business: job.business._id,
            applicant: decoded.id,
        })

        logger.info(`Job application created: job=${id} applicant=${decoded.id}`)

        return res.status(201).json({
            success: true,
            message: 'Applied to job successfully.',
            data: application.toObject(),
        })

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'You have already applied to this job.',
            })
        }

        logger.error(`Apply To Job Error: ${error.message}`)
        next(error)
    }
}

export const getJobApplications = async (req, res, next) => {
    try {

        const { params, decoded } = req
        const { id } = params

        const job = await Job.findById(id).populate('business', 'user')

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.',
            })
        }

        if (!isJobOwner(job, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        const applications = await JobApplication.find({ job: id })
            .select('applicant createdAt')
            .populate('applicant', 'name')
            .sort({ createdAt: -1 })
            .lean()

        return res.status(200).json({
            success: true,
            message: 'Job applications fetched successfully.',
            data: applications,
        })

    } catch (error) {
        logger.error(`Get Job Applications Error: ${error.message}`)
        next(error)
    }
}
