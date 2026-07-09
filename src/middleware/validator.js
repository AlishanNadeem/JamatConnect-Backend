import logger from "../config/logger.js"
import { removeFiles } from "../helpers/folder.js"

const validator = (schema, options = { optional: false }) => (req, res, next) => {

    const { optional } = options

    const cleanupUploadedFile = () => {
        if (req.file?.path) {
            removeFiles(req.file.path)
        }
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        if (optional) {
            return next()
        }

        cleanupUploadedFile()

        return res.status(400).json({
            success: false,
            message: 'Request body is missing or empty.',
        })
    }

    const { value, error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
        logger.error(error.details.map((err) => err.message))
        cleanupUploadedFile()
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.details.map((err) => err.message),
        });
    }

    req.body = value
    next()

}

export default validator