import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import ProductCategory from '../models/product-category.model.js'

dotenv.config()

const categories = [
    { name: 'Automotive' },
    { name: 'Beauty & Personal Care' },
    { name: 'Books & Stationery' },
    { name: 'Clothing' },
    { name: 'Electronics' },
    { name: 'Food & Groceries' },
    { name: 'Gifts' },
    { name: 'Handmade & Crafts' },
    { name: 'Health & Wellness' },
    { name: 'Home & Kitchen' },
    { name: 'Jewelry & Accessories' },
    { name: 'Pet Supplies' },
    { name: 'Sports & Fitness' },
    { name: 'Toys & Kids' },
]

const seedProductCategories = async () => {
    try {
        await connectDB()
        console.log('🔗 Connected to MongoDB')

        let created = 0
        let skipped = 0

        for (const category of categories) {
            const exists = await ProductCategory.findOne({ name: category.name })

            if (exists) {
                console.log(`⏭️  Skipped: ${category.name} (already exists)`)
                skipped++
                continue
            }

            await ProductCategory.create({
                name: category.name,
                active: true,
            })

            console.log(`✅ Seeded: ${category.name}`)
            created++
        }

        console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`)
    } catch (error) {
        console.error('❌ Seeding failed:', error.message)
        process.exit(1)
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Disconnected from MongoDB')
    }
}

seedProductCategories()
