import logger from '../config/logger.js'
import { removeFiles } from '../helpers/folder.js'
import { buildPaginationResponse, getPagination } from '../helpers/pagination.js'
import Marketplace from '../models/marketplace.model.js'
import ProductCategory from '../models/product-category.model.js'
import { expireMarketplaceListings, isMarketplaceOwner } from '../services/marketplace.service.js'
import { isAdmin, MARKETPLACE_STATUS, ROLES, searchRegex } from '../utils/index.js'

export const createMarketplace = async (req, res, next) => {

    const { body, file, decoded } = req
    const uploaded_image = file?.path?.replace(/\\/g, '/')

    const cleanupUploadedImage = () => {
        if (uploaded_image) removeFiles(uploaded_image)
    }

    try {

        const {
            name,
            description,
            category,
            price,
        } = body

        if (!uploaded_image) {
            return res.status(400).json({
                success: false,
                message: 'Listing image is required.',
            })
        }

        const category_exists = await ProductCategory.findOne({ _id: category, active: true })

        if (!category_exists) {
            cleanupUploadedImage()
            return res.status(400).json({
                success: false,
                message: 'Invalid product category.',
            })
        }

        let listing = new Marketplace({
            user: decoded.id,
            name,
            description,
            category,
            price,
            image: uploaded_image,
        })

        await listing.save()
        listing = listing.toObject({ virtuals: true })

        logger.info(`Marketplace listing created: ${listing.name}`)

        return res.status(201).json({
            success: true,
            message: 'Marketplace listing created successfully.',
            data: listing,
        })

    } catch (error) {
        cleanupUploadedImage()
        logger.error(`Create Marketplace Error: ${error.message}`)
        next(error)
    }
}

export const getMarketplaces = async (req, res, next) => {
    try {

        await expireMarketplaceListings()

        const { decoded, query } = req
        const { category, search } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = {
            status: MARKETPLACE_STATUS.ACTIVE,
            active: true,
            expires_at: { $gt: new Date() },
        }

        if (category) filter.category = category
        if (search) filter.name = searchRegex(search)

        if (decoded?.role === ROLES.USER) {
            filter.user = { $ne: decoded.id }
        }

        const listing_query = Marketplace.find(filter)
            .select('name price category image expires_at createdAt')
            .populate('category', 'name')
            .sort({ createdAt: -1 })

        if (skip !== null && limit !== null) {
            listing_query.skip(skip).limit(limit)
        }

        const [listings, total] = await Promise.all([
            listing_query.lean({ virtuals: true }),
            Marketplace.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'Marketplace listings fetched successfully.',
            ...buildPaginationResponse(listings, total, page, page_size),
        })

    } catch (error) {
        logger.error(`Get Marketplaces Error: ${error.message}`)
        next(error)
    }
}

export const getMyMarketplaces = async (req, res, next) => {
    try {

        await expireMarketplaceListings()

        const { decoded, query } = req
        const { category, search, status } = query
        const { skip, limit, page, page_size } = getPagination(query)

        const filter = { user: decoded.id }

        if (category) filter.category = category
        if (search) filter.name = searchRegex(search)
        if (status !== undefined) filter.status = status

        const listing_query = Marketplace.find(filter)
            .select('name description price category image status expires_at createdAt')
            .populate('category', 'name')
            .sort({ createdAt: -1 })

        if (skip !== null && limit !== null) {
            listing_query.skip(skip).limit(limit)
        }

        const [listings, total] = await Promise.all([
            listing_query.lean({ virtuals: true }),
            Marketplace.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            message: 'My marketplace listings fetched successfully.',
            ...buildPaginationResponse(listings, total, page, page_size),
        })

    } catch (error) {
        logger.error(`Get My Marketplaces Error: ${error.message}`)
        next(error)
    }
}

export const getMarketplaceById = async (req, res, next) => {
    try {

        await expireMarketplaceListings()

        const { decoded, params } = req
        const { id } = params

        const listing = await Marketplace.findById(id)
            .populate('category', 'name')
            .lean({ virtuals: true })

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Marketplace listing not found.',
            })
        }

        const is_owner = decoded?.id && listing.user.toString() === decoded.id
        const is_admin = isAdmin(decoded?.role)
        const is_public = listing.status === MARKETPLACE_STATUS.ACTIVE && listing.active && listing.expires_at > new Date()

        if (!is_owner && !is_admin && !is_public) {
            return res.status(404).json({
                success: false,
                message: 'Marketplace listing not found.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Marketplace listing fetched successfully.',
            data: listing,
        })

    } catch (error) {
        logger.error(`Get Marketplace Error: ${error.message}`)
        next(error)
    }
}

export const updateMarketplace = async (req, res, next) => {

    const { body, file, params, decoded } = req
    const { id } = params
    const uploaded_image = file?.path?.replace(/\\/g, '/')

    const cleanupUploadedImage = () => {
        if (uploaded_image) removeFiles(uploaded_image)
    }

    try {

        const listing = await Marketplace.findById(id)

        if (!listing) {
            cleanupUploadedImage()
            return res.status(404).json({
                success: false,
                message: 'Marketplace listing not found.',
            })
        }

        if (!isMarketplaceOwner(listing, decoded.id) && !isAdmin(decoded?.role)) {
            cleanupUploadedImage()
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        const {
            name,
            description,
            category,
            price,
            status,
            active,
        } = body

        const updated_fields = {}

        if (name !== undefined) updated_fields.name = name
        if (description !== undefined) updated_fields.description = description
        if (price !== undefined) updated_fields.price = price

        if (category !== undefined) {
            const category_exists = await ProductCategory.findOne({ _id: category, active: true })

            if (!category_exists) {
                cleanupUploadedImage()
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product category.',
                })
            }

            updated_fields.category = category
        }

        if (uploaded_image) {
            if (listing.image) removeFiles(listing.image)
            updated_fields.image = uploaded_image
        }

        if (status === MARKETPLACE_STATUS.SOLD) {
            updated_fields.status = MARKETPLACE_STATUS.SOLD
        }

        if (isAdmin(decoded?.role)) {
            if (status !== undefined) updated_fields.status = status
            if (active !== undefined) updated_fields.active = active
        }

        const updated_listing = await Marketplace.findByIdAndUpdate(
            id,
            { $set: updated_fields },
            { new: true, runValidators: true, lean: { virtuals: true } }
        )

        logger.info(`Marketplace listing updated: ${updated_listing.name}`)

        return res.status(200).json({
            success: true,
            message: 'Marketplace listing updated successfully.',
            data: updated_listing,
        })

    } catch (error) {
        cleanupUploadedImage()
        logger.error(`Update Marketplace Error: ${error.message}`)
        next(error)
    }
}

export const deleteMarketplace = async (req, res, next) => {
    try {

        const { params, decoded } = req
        const { id } = params

        const listing = await Marketplace.findById(id)

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Marketplace listing not found.',
            })
        }

        if (!isMarketplaceOwner(listing, decoded.id) && !isAdmin(decoded?.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.',
            })
        }

        await Marketplace.findByIdAndDelete(id)

        if (listing.image) removeFiles(listing.image)

        logger.info(`Marketplace listing deleted: ${listing.name}`)

        return res.status(200).json({
            success: true,
            message: 'Marketplace listing deleted successfully.',
        })

    } catch (error) {
        logger.error(`Delete Marketplace Error: ${error.message}`)
        next(error)
    }
}
