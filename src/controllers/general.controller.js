import dotenv from "dotenv"
import fs from 'fs/promises'
import path from 'path'
import logger from '../config/logger.js'
import { EMPLOYMENT_TYPE_OPTIONS, WORKPLACE_TYPE_OPTIONS } from '../utils/index.js'

dotenv.config()

export const getContent = async (req, res, next) => {
    try {

        const uploads_dir = path.join(process.cwd(), 'uploads')
        const base_url = `${process.env.BASE_URL}uploads`

        const files = {
            about_us: 'about-us.html',
            privacy_policy: 'privacy-policy.html',
            terms: 'terms.html',
            faqs: path.join(uploads_dir, 'faqs.json')
        }

        const json_files = ['faqs']
        const html_files = []

        const data = {}

        for (const [key, file] of Object.entries(files)) {

            try {

                const is_json = json_files.includes(key)
                const is_html = html_files.includes(key)

                if (is_json || is_html) {
                    const content = await fs.readFile(file, 'utf-8')
                    data[key] = is_json ? JSON.parse(content) : content
                } else {
                    data[key] = `${base_url}/${file}`
                }

            } catch (err) {
                logger.error(`Error reading ${key}: ${err.message}`)
                data[key] = null
            }

        }

        return res.status(200).json({
            success: true,
            data
        })

    } catch (error) {
        logger.error(`Get Content Error: ${error.message}`)
        next(error)
    }
}

export const getData = async (req, res, next) => {
    try {

        const data = {
            employment_types: EMPLOYMENT_TYPE_OPTIONS,
            workplace_types: WORKPLACE_TYPE_OPTIONS,
        }

        return res.status(200).json({
            success: true,
            data
        })

    } catch (error) {
        logger.error(`Get Data Error: ${error.message}`)
        next(error)
    }
}

export const getVersion = async (req, res, next) => {
    try {

        const data = {

            lastest_app_version: {
                android: '0.0.4',
                ios: '0.0.4'
            },
            download_urls: {
                android: 'https://play.google.com/store/apps/details?id=com.jamatconnect.app',
                ios: 'https://apps.apple.com/app/jamatconnect/id0000000000'
            },
            message: {
                title: 'New Update Available!',
                body: 'A new version of JamatConnect is available. Please update to the latest version for the best experience.'
            }

        }

        return res.status(200).json({
            success: true,
            data
        })

    } catch (error) {
        logger.error(`Get Version Error: ${error.message}`)
        next(error)
    }
}