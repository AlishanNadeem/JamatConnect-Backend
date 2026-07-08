import Feedback from "../models/feedback.model.js"
import logger from "../config/logger.js"

export const addFeedback = async (req, res, next) => {
    try {

        const { body, decoded } = req
        const { name, email, subject, message } = body

        const feedback = new Feedback({
            user: decoded?.id || null,
            name,
            email,
            subject,
            message
        })

        await feedback.save()

        logger.info(`Feedback submitted by: ${name} (${email})`)

        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully.',
            data: feedback
        })

    } catch (error) {
        logger.error(`Add Feedback Error: ${error.message}`)
        next(error)
    }
}
