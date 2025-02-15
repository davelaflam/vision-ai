import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import * as tf from '@tensorflow/tfjs-node'
import dotenv from 'dotenv'

dotenv.config()

import EmbeddingController from './embeddings.js'
import PineconeController from './pinecone.js'
import utils from './utils.js'
import { LoggerService } from './services/logger/LoggerService.js'

const pineconeDimensions = process.env.PINECONE_DIMENSIONS || 768
const pineconeIndexDimensions = Number(pineconeDimensions)

const app = express()
app.use(cors())
app.use(express.json())

let classLabels: Record<string, any> = {}
const CLASS_INDEX_URL = 'https://storage.googleapis.com/download.tensorflow.org/data/imagenet_class_index.json'
const PORT = process.env.PORT || 3000

/**
 * ✅ **Load Model on Server Startup**
 */
await EmbeddingController.loadModel()

/**
 * ✅ **Load ImageNet class labels from a remote URL**
 */
async function loadClassLabels() {
  try {
    const response = await fetch(CLASS_INDEX_URL)
    classLabels = (await response.json()) as Record<string, any>
    LoggerService.info('✅ ImageNet Labels Loaded Successfully!')
  } catch (error) {
    console.error('❌ Failed to load ImageNet class labels:', (error as Error).message)
  }
}
await loadClassLabels()

/**
 * ✅ **Middleware to ensure the MobileNet model is loaded before handling requests.**
 */
function ensureModelLoaded(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    EmbeddingController.getModel()
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Model not loaded yet!' })
  }
}

/**
 * 🏋 **Train endpoint to save embeddings to Pinecone.**
 */
app.post('/train', ensureModelLoaded, async (req, res) => {
  LoggerService.debug('/train API endpoint')

  try {
    LoggerService.info('🚀 Training started...')
    const { data, label, user } = req.body
    if (!data || !label || !user) {
      return res.status(400).json({ error: 'Missing image, label, or user!' })
    }

    const imageBuffer = Buffer.from(data, 'base64')
    const tensor = utils.preprocessImage(imageBuffer)

    LoggerService.info('✅ Image processed for training.')

    const model = EmbeddingController.getModel()

    let predictions: tf.Tensor
    if (EmbeddingController.useCustomModel && 'execute' in model) {
      predictions = model.execute(tensor) as tf.Tensor
    } else if ('infer' in model) {
      predictions = model.infer(tensor, true) as tf.Tensor
    } else {
      throw new Error('❌ Model type is unknown!')
    }

    const rawScores = (await predictions.array()) as number[][]

    if (!Array.isArray(rawScores) || rawScores.length === 0) {
      return res.status(500).json({ error: 'Invalid predictions from model' })
    }

    let embedding = utils.applySoftmax(rawScores[0])

    if (embedding.length > pineconeIndexDimensions) embedding = embedding.slice(0, pineconeIndexDimensions)
    if (embedding.length < pineconeIndexDimensions) embedding = embedding.concat(new Array(pineconeIndexDimensions - embedding.length).fill(0))

    const vectorId = `${user}-${label}-${Date.now()}`

    const upsertPayload = [
      {
        id: String(vectorId),
        values: embedding,
        metadata: { label, user },
      },
    ]

    const pineconeResponse = await PineconeController.saveEmbedding(upsertPayload)

    if (Array.isArray(pineconeResponse)) {
      const failedResponses = pineconeResponse.filter((result) => result.status === 'rejected')
      if (failedResponses.length > 0) {
        return res.status(500).json({
          error: 'Training failed!',
          details: failedResponses.map((r) => r.reason).join('; '),
        })
      }
    } else if (pineconeResponse && 'error' in pineconeResponse) {
      return res.status(500).json({ error: 'Training failed!', details: pineconeResponse.error })
    }

    return res.json({ message: 'Training completed successfully!' })
  } catch (error: any) {
    console.error('❌ Training error:', error)
    res.status(500).json({ error: 'Training failed!', details: error.message })
  }
})

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
    if (embedding.length < pineconeIndexDimensions) embedding = embedding.concat(new Array(pineconeIndexDimensions - embedding.length).fill(0))

    LoggerService.info('🔄 Querying Pinecone with the generated embedding...')

    const pineconeResults = await PineconeController.queryEmbedding({
      embedding,
      namespace: user,
      topK: 3,
    })

    if (!pineconeResults.length) {
      return res.json({ detectedLabel: 'Unknown Object', confidence: '0%' })
    }

    // ✅ Ensure confidence does not exceed 100%
    const formattedResults = pineconeResults.map((match) => ({
      label: match.metadata.label,
      confidence: `${Math.min(match.score * 100, 100).toFixed(2)}%`,
    }))

    res.json({ matches: formattedResults })
  } catch (error: any) {
    console.error('❌ Detection error:', error)
    res.status(500).json({ error: 'Detection failed!', details: error.message })
  }
})

/**
 * 🚀 **Start the server**
 */
async function startServer() {
  await EmbeddingController.loadModel()
  await loadClassLabels()

  app.listen(PORT, () => LoggerService.info(`🚀 Server running on port ${PORT}`))
}

startServer().catch((error) => console.error('❌ Server failed to start:', (error as Error).message))