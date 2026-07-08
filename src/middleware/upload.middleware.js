import multer from 'multer'
import path from 'path'

const makeStorage = (folder_name = '') =>
    multer.diskStorage({
        destination: (req, file, cb) => {
            try {

                const base_folder = 'uploads'
                const folder_path = folder_name
                    ? `${base_folder}/${folder_name}`
                    : base_folder

                cb(null, folder_path)

            } catch (err) {
                cb(err)
            }
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname)
            const filename = `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)}${ext}`
            cb(null, filename)
        },
    })

const upload = (folder_name = '') => {

    const storage = makeStorage(folder_name)

    return multer({
        storage,
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            cb(null, true)
        },
    })

}

export default upload
