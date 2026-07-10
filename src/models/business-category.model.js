import mongoose from 'mongoose'
import mongooseLeanVirtuals from 'mongoose-lean-virtuals'
import { getMediaUrl } from '../utils/index.js'

const business_category_schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    image: {
        type: String,
        trim: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

business_category_schema.virtual('image_url').get(function () {
    return getMediaUrl(this.image)
})

business_category_schema.index({ name: 1 }, { unique: true })
business_category_schema.index({ active: 1 })

business_category_schema.plugin(mongooseLeanVirtuals)

const BusinessCategory = mongoose.model('BusinessCategory', business_category_schema)

export default BusinessCategory
