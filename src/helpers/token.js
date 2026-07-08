import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const generateToken = async (payload, expiry) => {
    try {

        let options = {}

        if (expiry) {
            options.expiresIn = expiry
        }

        let token = jwt.sign(payload, process.env.JWT_SECRET_KEY, options)
        return token

    } catch (error) {
        throw new Error()
    }
}

const verifyToken = async (token) => {
    try {
        let result = jwt.verify(token, process.env.JWT_SECRET_KEY)
        return result
    } catch (error) {
        throw new Error("Invalid Auth Token")
    }
}

export {
    generateToken,
    verifyToken,
}
