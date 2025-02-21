import express from 'express'
import cors from 'cors'
import { fetch } from 'undici'
import * as tf from '@tensorflow/tfjs-node'
import dotenv from 'dotenv'

import EmbeddingController from '@/embeddings'
import pineconeController from '@/pinecone'
import utils from '@/utils'
import { LoggerService } from '@/services/logger/LoggerService'

dotenv.config()

const pineconeDimensions = process.env.PINECONE_DIMENSIONS || 768
const pineconeIndexDimensions = Number(pineconeDimensions)

const app = express()
app.use(cors())
app.use(express.json())

let classLabels: Record<string, any> = {}
const CLASS_INDEX_URL = 'https://storage.googleapis.com/download.tensorflow.org/data/imagenet_class_index.json'
const PORT = process.env.PORT || 3000

/**
 * ✅ **Load ImageNet class labels from a remote URL**
 */
export async function loadClassLabels() {
  try {
    const response = await fetch(CLASS_INDEX_URL)
    classLabels = (await response.json()) as Record<string, any>
    LoggerService.info('✅ ImageNet Labels Loaded Successfully!')
  } catch (error) {
    LoggerService.error('❌ Failed to load ImageNet class labels:', (error as Error).message)
  }
}

/**
 * ✅ **Middleware to ensure the MobileNet model is loaded before handling requests.**
 */
export function ensureModelLoaded(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    EmbeddingController.getModel()
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Model not loaded yet!' })
  }
}

/**
 * 🔍 **Detect endpoint to query embeddings from Pinecone.**
 */
app.post('/detect', ensureModelLoaded, async (req, res) => {
  LoggerService.debug('/detect API endpoint')

  try {
    LoggerService.info('🚀 Detection started...')

    const { data, user } = req.body
    if (!data || !user) return res.status(400).json({ error: 'Missing image or user!' })

    LoggerService.info('🛠️ Processing image for detection...')
    LoggerService.debug(`🔍 Image size received: ${data.length} characters`)

    const input = utils.preprocessImage(Buffer.from(data, 'base64'))
    const model = EmbeddingController.getModel()

    let predictions: tf.Tensor
    if (EmbeddingController.useCustomModel && 'execute' in model) {
      predictions = model.execute(input) as tf.Tensor
    } else if ('infer' in model) {
      predictions = model.infer(input, true) as tf.Tensor
    } else {
      throw new Error('❌ Model type is unknown!')
    }

    const rawScores = (await predictions.array()) as number[][]

    if (!Array.isArray(rawScores) || rawScores.length === 0) {
      return res.status(500).json({ error: 'Invalid predictions from model' })
    }

    let embedding = utils.applySoftmax(rawScores[0])

    if (embedding.length > pineconeIndexDimensions) embedding = embedding.slice(0, pineconeIndexDimensions)
    if (embedding.length < pineconeIndexDimensions)
      embedding = embedding.concat(new Array(pineconeIndexDimensions - embedding.length).fill(0))

    LoggerService.info('🔄 Querying Pinecone with the generated embedding...')

    const pineconeResults = await pineconeController.queryEmbedding({
      embedding,
      namespace: user,
      topK: 3,
    })

    if (!pineconeResults.length) {
      return res.json({ detectedLabel: 'Unknown Object', confidence: '0%' })
    }

    const formattedResults = pineconeResults.map((match: any) => ({
      label: match.metadata.label,
      confidence: `${Math.min(match.score * 100, 100).toFixed(2)}%`,
    }))

    res.json({ matches: formattedResults })
  } catch (error: any) {
    LoggerService.error('❌ Detection error:', error)
    res.status(500).json({ error: 'Detection failed!', details: error.message })
  }
})

/**
 * 🚀 **Train endpoint to save new embeddings to Pinecone.**
 */
app.post('/train', ensureModelLoaded, async (req, res) => {
  LoggerService.info('🚀 Training started...')
  try {
    const { data, label, user } = req.body
    if (!data || !label || !user) {
      return res.status(400).json({ error: 'Missing data, label, or user!' })
    }

    const imageBuffer = Buffer.from(data, 'base64')
    const tensor = utils.preprocessImage(imageBuffer)
    LoggerService.info('✅ Image processed for training.')

    let embedding = await EmbeddingController.getFeatureEmbeddings(tensor)

    const upsertPayload = [{ id: `${user}-${label}-${Date.now()}`, values: embedding, metadata: { label, user } }]
    await pineconeController.saveEmbedding(upsertPayload)

    res.json({ message: 'Training completed successfully!' })
  } catch (error: any) {
    LoggerService.error('❌ Training error:', error.message)
    res.status(500).json({ error: 'Training failed!', details: error.message })
  }
})

let server: ReturnType<typeof app.listen> | undefined

/**
 * 🚀 **Start the server without top-level await**
 */
export function startServer() {
  Promise.all([EmbeddingController.loadModel(), loadClassLabels()])
    .then(() => {
      server = app.listen(PORT, () => LoggerService.info(`🚀 Server running on port ${PORT}`))
    })
    .catch((error) => {
      LoggerService.error('❌ Server failed to start:', error)
      process.exit(1)
    })
}

// ✅ Conditionally start server if NOT in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer()
}

// Exporting for testing
export { app, server }
