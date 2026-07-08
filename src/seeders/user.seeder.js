import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/user.model.js'
import { AUTH_TYPES, generatePassword } from '../utils/index.js'
import connectDB from '../config/db.js'
import { sendMail } from '../helpers/mail.js'

dotenv.config()

const users = [
    {
        name: 'Alishan Nadeem',
        email: 'alishan.nadeem22@gmail.com',
        role: 'admin',
    }
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

            const password = generatePassword()

            const new_user = new User({
                name: user.name,
                email: user.email,
                password,
                role: user.role,
                auth_provider: AUTH_TYPES.EMAIL,
                active: true
            })

            await new_user.save()

            await sendMail({
                to: user.email,
                subject: "Welcome to JamatConnect",
                template: "signup",
                template_vars: {
                    name: user.name,
                    email: user.email,
                    password: password,
                    app_name: "JamatConnect",
                    logo_url: `${process.env.BASE_URL}uploads/logo.png`,
                    login_url: `${process.env.BASE_URL}login`
                }
            })

            console.log(`✅ Seeded: ${user.email} (role: ${user.role})`)
            console.log(`   🔑 Password: ${password}`)
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
