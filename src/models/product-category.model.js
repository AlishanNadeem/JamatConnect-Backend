import mongoose from 'mongoose'

const product_category_schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
}, {
    id: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

product_category_schema.index({ name: 1 }, { unique: true })
product_category_schema.index({ active: 1 })

const ProductCategory = mongoose.model('ProductCategory', product_category_schema)

export default ProductCategory
