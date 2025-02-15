import crypto from 'crypto'

import UtilsController from './utils.js'
import PineconeController from './pinecone.js'
import EmbeddingController from './embeddings.js'
import { LoggerService } from './services/logger/LoggerService.js'
import dotenv from 'dotenv'
dotenv.config()

const md5 = (str: string) => crypto.createHash('md5').update(str).digest('hex')
const pineconeDimensions = process.env.PINECONE_DIMENSIONS || 768
const pineconeIndexDimensions = Number(pineconeDimensions)

/**
 * Handles image processing and embedding extraction.
 * @param req
 * @param res
 * @returns
 */
export const handleImage = async (req: any, res: any) => {
  LoggerService.debug('HandlersController.handleImage')

  try {
    const { data, label, user, stage } = req.body
    if (!data || !user || !stage) {
      return res.status(400).json({ error: 'Missing required fields: data, user, stage.' })
    }

    LoggerService.info(`🖼️ Processing image for ${stage} mode...`)

    const imageBuffer = Buffer.from(data, 'base64')
    const tensor = UtilsController.preprocessImage(imageBuffer)
    LoggerService.info('✅ Processed Image Tensor Shape:', tensor.shape)

    let embedding = await EmbeddingController.getFeatureEmbeddings(tensor)
    LoggerService.info('✅ Extracted Feature Embedding Size:', JSON.stringify(embedding.length))

    // 🚨 Ensure embeddings are 768 dimensions (truncate or pad if needed)
    if (embedding.length > pineconeIndexDimensions) {
      embedding = embedding.slice(0, pineconeIndexDimensions)
    } else if (embedding.length < pineconeIndexDimensions) {
      embedding = embedding.concat(new Array(pineconeIndexDimensions - embedding.length).fill(0))
    }

    if (stage === 'train') {
      const id = `${label}-${UtilsController.generateUniqueId()}`
      // @ts-ignore
      await PineconeController.saveEmbedding([{ id, values: embedding, metadata: { label }, namespace: user }])
      return res.json({ message: 'Training success', id })
    } else if (stage === 'detect') {
      const results = await PineconeController.queryEmbedding({ embedding, namespace: user, topK: 5 })
      return res.json({ message: 'Detection success', results })
    }

    return res.status(400).json({ error: 'Invalid stage specified.' })
  } catch (error) {
    console.error('❌ Error handling image:', error)
    // @ts-ignore
    res.status(500).json({ error: 'Server error', message: error.message })
  }
}

/**
 * Handles deleting a user namespace.
 * @param req
 * @param res
 * @returns
 */
export const handleDeleteUser = async (req: any, res: any) => {
  LoggerService.debug('HandlersController.handleDeleteUser')

  const { user } = req.query
  if (!user) return res.status(400).json({ message: 'missing user' })

  const hashedUser = md5(user)
  try {
    await PineconeController.deleteNamespace({ namespace: hashedUser })
    res.json({ message: 'success' })
  } catch (e) {
    console.error('❌ Error deleting namespace:', e)
    res.status(500).json({ message: 'failed to delete user namespace' })
  } finally {
    console.groupEnd()
  }
}
