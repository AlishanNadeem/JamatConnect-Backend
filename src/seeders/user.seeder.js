import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import { sendMail } from '../helpers/mail.js'
import User from '../models/user.model.js'
import { AUTH_TYPES, generatePassword, ROLES } from '../utils/index.js'

dotenv.config()

const ADMIN_PASSWORD = 'Admin@123'

const users = [
    {
        name: 'Jamat Connect Admin',
        email: 'info@jamatconnect.com',
        password: ADMIN_PASSWORD,
        role: ROLES.ADMIN,
    },
    {
        name: 'Alishan Nadeem',
        email: 'alishan.nadeem22@gmail.com',
        role: ROLES.USER,
    },
    {
        name: 'Shayan Merchant',
        email: 'shayanmerchant@hotmail.com',
        role: ROLES.USER,
    },
    {
        name: 'Almohin Dhamani',
        email: 'almohin@gmail.com',
        role: ROLES.USER,
    },
    {
        name: 'Asif Valji',
        email: 'admin@imash.com.au',
        role: ROLES.USER,
    },
]

const seedUsers = async () => {
    try {
        await connectDB()
        console.log('🔗 Connected to MongoDB')

        let created = 0
        let skipped = 0
        let emailed = 0

        for (const user of users) {
            const exists = await User.findOne({ email: user.email })
            if (exists) {
                console.log(`⏭️  Skipped: ${user.email} (already exists)`)
                skipped++
                continue
            }

            const password = user.role === ROLES.USER
                ? generatePassword(12)
                : (user.password || ADMIN_PASSWORD)

            const new_user = new User({
                name: user.name,
                email: user.email,
                password,
                role: user.role,
                is_seed: true,
                auth_provider: AUTH_TYPES.EMAIL,
                active: true,
            })

            await new_user.save()
            console.log(`✅ Seeded: ${user.email} (role: ${user.role})`)
            created++

            try {
                await sendMail({
                    to: user.email,
                    subject: 'Welcome to Jamat Connect — your login details',
                    template: 'admin_user_invite',
                    template_vars: {
                        name: user.name,
                        email: user.email,
                        password,
                        app_name: 'Jamat Connect',
                        logo_url: `${process.env.BASE_URL}uploads/logo.png`,
                    },
                })
                console.log(`📧 Invite sent: ${user.email}`)
                emailed++
            } catch (mail_error) {
                console.error(`❌ Invite failed for ${user.email}:`, mail_error.message)
            }
        }

        console.log(`\n📊 Summary: ${created} created, ${skipped} skipped, ${emailed} emailed`)
    } catch (error) {
        console.error('❌ Seeding failed:', error.message)
        process.exit(1)
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Disconnected from MongoDB')
    }
}

seedUsers()
