import express from 'express'
import { getContent, getData, getVersion } from '../controllers/general.controller.js'

const router = express.Router()

router.get('/get-content', getContent)

router.get('/get-data', getData)

router.get('/version', getVersion)

export default router