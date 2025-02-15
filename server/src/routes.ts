import express from 'express'

import { handleImage, handleDeleteUser } from './handlers.js'

const router = express.Router()

router.get('/health', (_, res) => res.send('ok'))

// ✅ Restore this so the frontend works again
router.post('/api/image', handleImage)

// Keep the new routes (if needed)
router.post('/train', handleImage)
router.post('/detect', handleImage)
router.delete('/user', handleDeleteUser)

export default router
