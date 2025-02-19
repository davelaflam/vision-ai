import express from 'express'

import { handleImage, handleDeleteUser } from '@/handlers'

const router = express.Router()

router.get('/health', (_, res) => res.send('ok'))

router.post('/api/image', handleImage)

router.post('/train', handleImage)

router.post('/detect', handleImage)

router.delete('/user', handleDeleteUser)

export default router
