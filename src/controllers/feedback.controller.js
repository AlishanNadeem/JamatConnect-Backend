import Feedback from '../models/feedback.model.js'
import logger from '../config/logger.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import { getMediaUrl, searchRegex } from '../utils/index.js'

const withUserImage = (feedback) => {

    if (!feedback?.user) return feedback

    return {
        ...feedback,
        user: {
            ...feedback.user,
            image_url: getMediaUrl(feedback.user.image),
        },
    }

}

export const addFeedback = async (req, res, next) => {
    try {
        const { body, decoded } = req
        const { name, email, subject, message } = body

        const feedback = new Feedback({
            user: decoded?.id || null,
            name,
            email,
            subject,
            message,
        })

        await feedback.save()

        logger.info(`Feedback submitted by: ${name} (${email})`)

        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully.',
            data: feedback,
        })
    } catch (error) {
        logger.error(`Add Feedback Error: ${error.message}`)
        next(error)
    }
}

export const getFeedbacks = async (req, res, next) => {
    try {
        const { query } = req
        const { search, is_read } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = {}
        const and = []

        if (is_read !== undefined) {
            const read = is_read === true || is_read === 'true'
            if (read) {
                and.push({ is_read: true })
            } else {
                and.push({
                    $or: [{ is_read: false }, { is_read: { $exists: false } }],
                })
            }
        }

        if (search !== undefined && String(search).trim()) {
            const regex = searchRegex(String(search).trim())
            and.push({
                $or: [
                    { name: regex },
                    { email: regex },
                    { subject: regex },
                    { message: regex },
                ],
            })
        }

        if (and.length) filter.$and = and

        const [feedbacks, total] = await Promise.all([
            Feedback.find(filter)
                .populate({
                    path: 'user',
                    select: 'name email image',
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Feedback.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'Feedbacks fetched successfully.',
            ...buildPaginationResponse(feedbacks.map(withUserImage), total, page, page_size),
        })
    } catch (error) {
        logger.error(`Get Feedbacks Error: ${error.message}`)
        next(error)
    }
}

export const getFeedbackById = async (req, res, next) => {
    try {
        const { params } = req
        const { id } = params

        const feedback = await Feedback.findById(id)
            .populate({
                path: 'user',
                select: 'name email image',
            })
            .lean()

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found.',
            })
        }

        if (!feedback.is_read) {
            await Feedback.findByIdAndUpdate(id, { $set: { is_read: true } })
            feedback.is_read = true
        }

        return res.status(200).json({
            success: true,
            message: 'Feedback fetched successfully.',
            data: withUserImage(feedback),
        })
    } catch (error) {
        logger.error(`Get Feedback Error: ${error.message}`)
        next(error)
    }
}

export const toggleFeedbackRead = async (req, res, next) => {
    try {
        const { params } = req
        const { id } = params

        const feedback = await Feedback.findById(id)

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found.',
            })
        }

        feedback.is_read = !feedback.is_read
        await feedback.save()

        const data = await Feedback.findById(feedback._id)
            .populate({
                path: 'user',
                select: 'name email image',
            })
            .lean()

        return res.status(200).json({
            success: true,
            message: feedback.is_read
                ? 'Feedback marked as read.'
                : 'Feedback marked as unread.',
            data: withUserImage(data),
        })
    } catch (error) {
        logger.error(`Toggle Feedback Read Error: ${error.message}`)
        next(error)
    }
}
