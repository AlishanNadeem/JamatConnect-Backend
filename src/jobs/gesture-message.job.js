import cron from 'node-cron'
import logger from '../config/logger.js'
import { sendPushToAllUsers } from '../services/notification.service.js'

// Rotates through these on Mon / Wed / Fri at 00:00 UTC
const GESTURE_MESSAGES = [
    {
        title: 'A gentle start',
        body: 'May your day begin with ease, kindness, and a little extra light.',
    },
    {
        title: 'Thinking of you',
        body: 'Wherever you are today, we hope you feel supported by your community.',
    },
    {
        title: 'Small moments matter',
        body: 'A warm greeting, a helping hand, a kind word — they all count.',
    },
    {
        title: 'You belong here',
        body: 'Jamat Connect is better because you are part of it. Have a beautiful day.',
    },
    {
        title: 'Spread a little goodness',
        body: 'Check in on someone today. Your presence can mean more than you know.',
    },
    {
        title: 'Stay grounded',
        body: 'Take a breath, take your time, and take care of yourself today.',
    },
    {
        title: 'Community starts with you',
        body: 'Every connection you make helps our jamat grow closer. Thank you.',
    },
    {
        title: 'Keep going',
        body: 'Even quiet efforts matter. Your consistency is a gift to those around you.',
    },
    {
        title: 'A note of appreciation',
        body: 'Thank you for being here — for showing up, sharing, and supporting others.',
    },
    {
        title: 'Make space for peace',
        body: 'Today is a good day to choose calm, patience, and a softer approach.',
    },
    {
        title: 'You make a difference',
        body: 'Whether you notice it or not, someone is grateful you are in their circle.',
    },
    {
        title: 'Grow together',
        body: 'Invite, support, and uplift — that is how a community thrives.',
    },
]

const getGestureForToday = () => {

    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0))
    const day_of_year = Math.floor((now - start) / (24 * 60 * 60 * 1000))
    return GESTURE_MESSAGES[day_of_year % GESTURE_MESSAGES.length]

}

const sendGestureMessage = async () => {
    try {

        const message = getGestureForToday()

        const result = await sendPushToAllUsers({
            title: message.title,
            body: message.body,
            data: {
                type: 'daily_gesture',
            },
        })

        logger.info(
            `Gesture message sent: "${message.title}" success=${result.success_count} failure=${result.failure_count}`
        )

    } catch (error) {
        logger.error(`Gesture message job error: ${error.message}`)
    }
}

export const startGestureMessageJob = () => {

    cron.schedule('0 0 * * 1,3,5', sendGestureMessage, {
        timezone: 'UTC',
    })

    logger.info('Gesture message cron scheduled for Mon/Wed/Fri at 00:00 UTC.')

}
