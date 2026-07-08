import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/user.model.js'
import { AUTH_TYPES, ROLES } from '../utils/index.js'
import connectDB from '../config/db.js'

dotenv.config()

const ADMIN_PASSWORD = 'Admin@123'

const users = [
    {
        name: 'Alishan Nadeem',
        email: 'alishan.nadeem22@gmail.com',
        password: ADMIN_PASSWORD,
        role: ROLES.ADMIN,
    },
    {
        name: 'Jamat Connect Admin',
        email: 'info@jamatconnect.com',
        password: ADMIN_PASSWORD,
        role: ROLES.ADMIN,
    },
    {
        name: 'Karim Ali',
        email: 'karim@jamatconnect.com',
        password: ADMIN_PASSWORD,
        role: ROLES.USER,
    },
    {
        name: 'Yasmin Hassan',
        email: 'yasmin@jamatconnect.com',
        password: ADMIN_PASSWORD,
        role: ROLES.USER,
    },
    {
        name: 'Salim Merali',
        email: 'salim@jamatconnect.com',
        password: ADMIN_PASSWORD,
        role: ROLES.USER,
    },
    {
        name: 'Gulbano Shah',
        email: 'gulbano@jamatconnect.com',
        password: ADMIN_PASSWORD,
        role: ROLES.USER,
    },
    {
        name: 'Nazim Hussain',
        email: 'nazim@jamatconnect.com',
        password: ADMIN_PASSWORD,
        role: ROLES.USER,
    },
]

const seedUsers = async () => {
    try {
        await connectDB()
        console.log('🔗 Connected to MongoDB')

        let created = 0
        let skipped = 0

        for (const user of users) {
            const exists = await User.findOne({ email: user.email })
            if (exists) {
                console.log(`⏭️  Skipped: ${user.email} (already exists)`)
                skipped++
                continue
            }

            const new_user = new User({
                name: user.name,
                email: user.email,
                password: user.password,
                role: user.role,
                is_seed: true,
                auth_provider: AUTH_TYPES.EMAIL,
                active: true,
            })

            await new_user.save()

            console.log(`✅ Seeded: ${user.email} (role: ${user.role})`)
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

seedUsers()
