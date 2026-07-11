import mongoose from 'mongoose'
import Business from '../models/business.model.js'

const normalizeSlug = (name) => {
    return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}

export const generateSlug = async (name, exclude_id = null) => {

    const base_slug = normalizeSlug(name)
    let slug = base_slug
    let suffix = 0

    while (await Business.exists({
        slug,
        ...(exclude_id && { _id: { $ne: exclude_id } }),
    })) {
        suffix++
        slug = `${base_slug}-${suffix}`
    }

    return slug

}

export const getBusinessByIdentifier = async (identifier, { lean = true } = {}) => {

    const query = mongoose.isValidObjectId(identifier)
        ? Business.findById(identifier)
        : Business.findOne({ slug: identifier })

    if (lean) {
        return query.lean({ virtuals: true })
    }

    return query

}

export const isBusinessOwner = (business, user_id) => business.user.toString() === user_id
