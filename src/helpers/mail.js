import dotenv from "dotenv"
import ejs from "ejs"
import nodemailer from "nodemailer"
import path from "path"
import logger from "../config/logger.js"

dotenv.config()

export const sendMail = async ({
    to,
    subject,
    template = null,
    template_vars = {},
    text = "",
    html = ""
}) => {

    if (!to || !subject) {
        throw new Error("Invalid parameters for send_email.")
    }

    try {

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 465,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })

        if (template) {

            const template_path = path.join(
                process.cwd(),
                "templates",
                `${template}.ejs`
            )

            html = await ejs.renderFile(template_path, template_vars)

        }

        const info = await transporter.sendMail({
            from: `"No Reply" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text: text || html.replace(/<[^>]+>/g, ""),
            html,
        })

        logger.info(`✅ Email sent to ${to}: ${info.messageId}`)
        return info

    } catch (err) {
        logger.error("Error sending email:", err)
        throw err
    }
}