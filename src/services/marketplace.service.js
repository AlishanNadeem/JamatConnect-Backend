import Marketplace from '../models/marketplace.model.js'
import { MARKETPLACE_STATUS } from '../utils/index.js'

export const expireMarketplaceListings = async () => {
    return Marketplace.updateMany(
        {
            status: MARKETPLACE_STATUS.ACTIVE,
            expires_at: { $lte: new Date() },
        },
        { $set: { status: MARKETPLACE_STATUS.EXPIRED } }
    )
}

export const isMarketplaceOwner = (listing, user_id) => listing.user.toString() === user_id
