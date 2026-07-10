import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import BusinessCategory from '../models/business-category.model.js'

dotenv.config()

const categories = [
    {
        name: 'Food',
        image: 'uploads/business-category/food.jpg',
        description: 'Restaurants, catering, bakeries, and food services.',
    },
    {
        name: 'Retail',
        image: 'uploads/business-category/retail.jpg',
        description: 'Shops, boutiques, and retail stores.',
    },
    {
        name: 'Professional Services',
        image: 'uploads/business-category/professional_services.jpg',
        description: 'Consulting, legal, accounting, and professional services.',
    },
    {
        name: 'Health',
        image: 'uploads/business-category/health.jpg',
        description: 'Healthcare, wellness, and medical services.',
    },
    {
        name: 'Education',
        image: 'uploads/business-category/education.jpg',
        description: 'Tutoring, training, and educational services.',
    },
    {
        name: 'Technology',
        image: 'uploads/business-category/technology.jpg',
        description: 'IT services, software, and technology solutions.',
    },
    {
        name: 'Beauty & Personal Care',
        image: 'uploads/business-category/beauty_personal_care.jpg',
        description: 'Salons, spas, barbershops, and grooming services.',
    },
    {
        name: 'Fitness',
        image: 'uploads/business-category/fitness.jpg',
        description: 'Gyms, personal trainers, and fitness studios.',
    },
    {
        name: 'Hospitality',
        image: 'uploads/business-category/hospitality.jpg',
        description: 'Hotels, guesthouses, and lodging services.',
    },
    {
        name: 'Events',
        image: 'uploads/business-category/events.jpg',
        description: 'Event venues, banquet halls, and event planning.',
    },
    {
        name: 'Photography & Videography',
        image: 'uploads/business-category/photography_videography.jpg',
        description: 'Photographers, videographers, and studio services.',
    },
    {
        name: 'Automotive',
        image: 'uploads/business-category/automotive.jpg',
        description: 'Auto repair, car rentals, and vehicle services.',
    },
    {
        name: 'Home Services',
        image: 'uploads/business-category/home_services.jpg',
        description: 'Repairs, cleaning, maintenance, and home improvement.',
    },
    {
        name: 'Real Estate',
        image: 'uploads/business-category/real_estate.jpg',
        description: 'Property agents, viewings, and real estate services.',
    },
    {
        name: 'Travel & Tourism',
        image: 'uploads/business-category/travel_tourism.jpg',
        description: 'Travel agencies, tour operators, and holiday packages.',
    },
    {
        name: 'Entertainment',
        image: 'uploads/business-category/entertainment.jpg',
        description: 'Cinemas, gaming zones, and entertainment venues.',
    },
    {
        name: 'Fashion & Tailoring',
        image: 'uploads/business-category/fashion_tailoring.jpg',
        description: 'Custom tailoring, fashion design, and clothing services.',
    },
    {
        name: 'Furniture & Home Decor',
        image: 'uploads/business-category/furniture_home_decor.jpg',
        description: 'Custom furniture, interior design, and home decor.',
    },
    {
        name: 'Pet Services',
        image: 'uploads/business-category/pet_services.jpg',
        description: 'Pet grooming, boarding, and veterinary services.',
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
