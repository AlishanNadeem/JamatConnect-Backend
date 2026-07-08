import bcrypt from "bcryptjs"

const encryptData = async (text) => {
    try {
        let result = await bcrypt.hash(text, 8)
        return result
    } catch (error) {
        return error
    }
}

const compareData = async (text, hash) => {
    try {
        let result = await bcrypt.compare(text, hash)
        return result
    } catch (error) {
        return error
    }
}

export { encryptData, compareData }