import path from 'path'
import * as fs from 'fs'

import * as tf from '@tensorflow/tfjs-node'
import * as mobilenet from '@tensorflow-models/mobilenet'
import * as dotenv from 'dotenv'

import { LoggerService } from '@/services/logger/LoggerService'

dotenv.config()

/**
 * Class for handling MobileNet model interactions.
 */
class EmbeddingController {
  private static instance: EmbeddingController | null = null
  private model: tf.GraphModel | mobilenet.MobileNet | null = null

  get useCustomModel(): boolean {
    return process.env.USE_CUSTOM_MODEL === 'true'
  }

  private readonly customModelPath: string = `file://${path.resolve(
    process.cwd(),
    'src/models/mobilenet/mobilenet_tfjs/model.json',
  )}`

  private constructor() {}

  /**
   * Get the singleton instance of EmbeddingController.
   */
  public static getInstance(): EmbeddingController {
    LoggerService.debug('🔗 EmbeddingController.getInstance()')
    if (!EmbeddingController.instance) {
      EmbeddingController.instance = new EmbeddingController()
    }
    return EmbeddingController.instance
  }

  /**
   * Load MobileNet Model.
   */
  public async loadModel(): Promise<void> {
    LoggerService.debug('🔗 EmbeddingController.loadModel()')
    if (!this.model) {
      if (this.useCustomModel) {
        LoggerService.info(`🚀 Loading Custom MobileNetV2 Model from ${this.customModelPath}...`)

        const modelFilePath = this.customModelPath.replace('file://', '')

        if (!fs.existsSync(modelFilePath)) {
          LoggerService.error(`❌ Model file not found at: ${modelFilePath}`)
          throw new Error(`Model file not found at ${modelFilePath}`)
        }
        try {
          // Load as a GraphModel.
          this.model = await tf.loadGraphModel(this.customModelPath)
          LoggerService.info('✅ Custom MobileNetV2 Model Loaded Successfully!')
        } catch (error: any) {
          LoggerService.error('❌ Failed to load custom model:', error.message || error)
          throw new Error(`Failed to load custom MobileNetV2 model: ${error.message}`)
        }
      } else {
        LoggerService.info('🚀 Loading Default MobileNetV2 from TensorFlow.js...')
        this.model = await mobilenet.load({ version: 2, alpha: 1.0 })
        LoggerService.info('✅ Default MobileNetV2 Model Loaded Successfully!')
      }
    }
  }

  /**
   * Get the loaded MobileNet model instance.
   */
  public getModel(): tf.GraphModel | mobilenet.MobileNet {
    LoggerService.debug('🔗 EmbeddingController.getModel()')
    if (!this.model) {
      throw new Error('❌ Model not loaded yet! Ensure `loadModel()` is called at startup.')
    }
    return this.model
  }

  /**
   * Extracts feature embeddings from an input tensor.
   * @param tensor - Input tensor.
   * @returns Array of feature embeddings.
   */
  public async getFeatureEmbeddings(tensor: tf.Tensor): Promise<number[]> {
    LoggerService.debug('🔗 EmbeddingController.getFeatureEmbeddings()')
    if (!this.model) {
      throw new Error('❌ Model not loaded yet!')
    }
    let embeddingsTensor: tf.Tensor
    if (this.useCustomModel && this.model instanceof tf.GraphModel) {
      // For a custom model, use execute().
      embeddingsTensor = this.model.execute(tensor) as tf.Tensor
    } else if (!this.useCustomModel && 'infer' in this.model) {
      // For the default MobileNet model, use infer().
      embeddingsTensor = (this.model as mobilenet.MobileNet).infer(tensor, true) as tf.Tensor
    } else {
      throw new Error('❌ Model type is unknown, cannot process embeddings!')
    }
    const embeddingArray = Array.from(await embeddingsTensor.data())
    return embeddingArray.length > 768
      ? embeddingArray.slice(0, 768)
      : embeddingArray.concat(new Array(768 - embeddingArray.length).fill(0))
  }
}

/**
 * Export a singleton instance.
 */
export default EmbeddingController.getInstance()
export { EmbeddingController }
