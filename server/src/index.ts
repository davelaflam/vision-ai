import express from 'express'
import cors from 'cors'
import { fetch } from 'undici'
import dotenv from 'dotenv'

import EmbeddingController from '@/embeddings/EmbeddingsController'
import { LoggerService } from '@/services/logger/LoggerService'
import routes from '@/routes'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

let classLabels: Record<string, any> = {}
const CLASS_INDEX_URL = 'https://storage.googleapis.com/download.tensorflow.org/data/imagenet_class_index.json'
const PORT = process.env.PORT || 3000

/**
 * Load ImageNet class labels from a remote URL
 */
export async function loadClassLabels() {
  LoggerService.debug('🔍 Loading ImageNet class labels...')
  try {
    const response = await fetch(CLASS_INDEX_URL)
    classLabels = (await response.json()) as Record<string, any>
    LoggerService.info('✅ ImageNet Labels Loaded Successfully!')
  } catch (error) {
    LoggerService.error('❌ Failed to load ImageNet class labels:', (error as Error).message)
  }
}

/**
 * Middleware to ensure the MobileNet model is loaded before handling requests
 */
export function ensureModelLoaded(req: express.Request, res: express.Response, next: express.NextFunction) {
  LoggerService.debug('🔍 Checking if model is loaded...')
  try {
    EmbeddingController.getModel()
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Model not loaded yet!' })
  }
}

app.use('/', routes)

let server: ReturnType<typeof app.listen> | undefined

/**
 * Start the server without top-level await
 */
export function startServer(): void {
  LoggerService.debug('🚀 Starting server...')
  Promise.all([EmbeddingController.loadModel(), loadClassLabels()])
    .then(() => {
      server = app.listen(PORT, () => LoggerService.info(`🚀 Server running on port ${PORT}`))
    })
    .catch((error) => {
      LoggerService.error('❌ Server failed to start:', error)
      process.exit(1)
    })
}

if (process.env.NODE_ENV !== 'test') {
  startServer()
}

/**
 * Export the app and server for testing
 */
export { app, server }
