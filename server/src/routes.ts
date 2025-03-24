import express from 'express'
import * as tf from '@tensorflow/tfjs-node'

import { handleImage, handleDeleteUser } from '@/handlers/handlers'
import { ensureModelLoaded } from '@/index'
import EmbeddingController from '@/embeddings/EmbeddingsController'
import pineconeController from '@/pinecone/PineconeController'
import utilsController from '@/utils/UtilsController'
import { LoggerService } from '@/services/logger/LoggerService'

const router = express.Router()

router.get('/health', (_, res) => res.send('ok'))

// /train Endpoint
router.post('/train', ensureModelLoaded, async (req, res) => {
  LoggerService.debug('/train API endpoint')
  try {
    const { data, label, user } = req.body
    if (!data || !label || !user) {
      return res.status(400).json({ error: 'Missing data, label, or user!' })
    }
    const imageBuffer = Buffer.from(data, 'base64')
    const tensor = utilsController.preprocessImage(imageBuffer)
    LoggerService.info('✅ Image processed for training.')

    let embedding = await EmbeddingController.getFeatureEmbeddings(tensor)
    const upsertPayload = [
      {
        id: `${user}-${label}-${Date.now()}`,
        values: embedding,
        metadata: { label, user },
      },
    ]
    await pineconeController.saveEmbedding(upsertPayload)
    res.json({ message: 'Training completed successfully!' })
  } catch (error: any) {
    LoggerService.error('❌ Training error:', error.message)
    res.status(500).json({ error: 'Training failed!', details: error.message })
  }
})

// /detect Endpoint
router.post('/detect', ensureModelLoaded, async (req, res) => {
  LoggerService.debug('/detect API endpoint')
  try {
    LoggerService.info('🚀 Detection started...')
    const { data, user } = req.body
    if (!data || !user) {
      return res.status(400).json({ error: 'Missing image or user!' })
    }
    LoggerService.info('🛠️ Processing image for detection...')
    LoggerService.debug(`🔍 Image size received: ${data.length} characters`)
    const input = utilsController.preprocessImage(Buffer.from(data, 'base64'))
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
    let embedding = utilsController.applySoftmax(rawScores[0])
    const pineconeDimensions = process.env.PINECONE_DIMENSIONS || 768
    const pineconeIndexDimensions = Number(pineconeDimensions)
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

router.post('/api/image', handleImage)
router.delete('/user', handleDeleteUser)

export default router
