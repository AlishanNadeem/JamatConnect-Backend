import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import BusinessCategory from '../models/business-category.model.js'

dotenv.config()

const categories = [
    {
        name: 'Automotive',
        image: 'uploads/business-category/automotive.png',
        description: 'Auto repair, car rentals, and vehicle services.',
    },
    {
        name: 'Beauty & Personal Care',
        image: 'uploads/business-category/beauty_personal_care.png',
        description: 'Salons, spas, barbershops, and grooming services.',
    },
    {
        name: 'Education',
        image: 'uploads/business-category/education.png',
        description: 'Tutoring, training, and educational services.',
    },
    {
        name: 'Entertainment',
        image: 'uploads/business-category/entertainment.png',
        description: 'Cinemas, gaming zones, and entertainment venues.',
    },
    {
        name: 'Events',
        image: 'uploads/business-category/events.png',
        description: 'Event venues, banquet halls, and event planning.',
    },
    {
        name: 'Fashion & Tailoring',
        image: 'uploads/business-category/fashion.png',
        description: 'Custom tailoring, fashion design, and clothing services.',
    },
    {
        name: 'Fitness',
        image: 'uploads/business-category/fitness.png',
        description: 'Gyms, personal trainers, and fitness studios.',
    },
    {
        name: 'Food',
        image: 'uploads/business-category/food.png',
        description: 'Restaurants, catering, bakeries, and food services.',
    },
    {
        name: 'Furniture & Home Decor',
        image: 'uploads/business-category/furniture.png',
        description: 'Custom furniture, interior design, and home decor.',
    },
    {
        name: 'Health',
        image: 'uploads/business-category/health.png',
        description: 'Healthcare, wellness, and medical services.',
    },
    {
        name: 'Home Services',
        image: 'uploads/business-category/home-services.png',
        description: 'Repairs, cleaning, maintenance, and home improvement.',
    },
    {
        name: 'Pet Services',
        image: 'uploads/business-category/pet-services.png',
        description: 'Pet grooming, boarding, and veterinary services.',
    },
    {
        name: 'Photography & Videography',
        image: 'uploads/business-category/photography.png',
        description: 'Photographers, videographers, and studio services.',
    },
    {
        name: 'Real Estate',
        image: 'uploads/business-category/real-estate.png',
        description: 'Property agents, viewings, and real estate services.',
    },
    {
        name: 'Retail',
        image: 'uploads/business-category/retail.png',
        description: 'Shops, boutiques, and retail stores.',
    },
    {
        name: 'Technology',
        image: 'uploads/business-category/technology.png',
        description: 'IT services, software, and technology solutions.',
    },
    {
        name: 'Travel & Tourism',
        image: 'uploads/business-category/tourism.png',
        description: 'Travel agencies, tour operators, and holiday packages.',
    },
]

const seedBusinessCategories = async () => {
    try {
        await connectDB()
        console.log('🔗 Connected to MongoDB')

        let created = 0
        let skipped = 0

        for (const category of categories) {
            const exists = await BusinessCategory.findOne({ name: category.name })

            if (exists) {
                console.log(`⏭️  Skipped: ${category.name} (already exists)`)
                skipped++
                continue
            }

            await BusinessCategory.create({
                name: category.name,
                description: category.description,
                image: category.image,
                active: true,
            })

            console.log(`✅ Seeded: ${category.name} (${category.image})`)
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

seedBusinessCategories()
