import * as tf from '@tensorflow/tfjs-node'
import { LoggerService } from './services/logger/LoggerService.js'

/**
 * Utility class for handling image processing and unique ID generation.
 */
class UtilsController {
  private static instance: UtilsController

  private constructor() {}

  /**
   * Get the singleton instance of UtilsController
   * @returns {UtilsController}
   */
  public static getInstance(): UtilsController {
    LoggerService.debug('UtilsController.getInstance()')

    if (!UtilsController.instance) {
      UtilsController.instance = new UtilsController()
    }
    return UtilsController.instance
  }

  /**
   * Converts an image buffer to a TensorFlow tensor and resizes it.
   * @param {Buffer} imageBuffer
   * @returns {tf.Tensor}
   */
  preprocessImage(imageBuffer: Uint8Array | Buffer): tf.Tensor {
    let tensor = tf.node.decodeImage(imageBuffer, 3)
    tensor = tf.image.resizeBilinear(tensor, [224, 224]).expandDims(0)

    // ✅ Normalize pixel values to [0,1] range
    return tensor.toFloat().div(tf.scalar(255))
  }

  /**
   * Applies Softmax to normalize prediction scores.
   * @param {number[]} logits - The raw output scores from the model
   * @returns {number[]} Normalized probabilities summing to 1
   */
  /*applySoftmax(logits: number[]): number[] {
    const tensor = tf.tensor(logits)
    const softmaxValues = tf.softmax(tensor).arraySync() as number[]

    // ✅ Ensure sum of probabilities = 1
    const sum = softmaxValues.reduce((acc, val) => acc + val, 0)
    return softmaxValues.map((val) => val / sum) // ✅ Normalize manually if needed
  }*/
  applySoftmax(logits: number[]): number[] {
    const tensor = tf.tensor(logits)
    return Array.from(tf.softmax(tensor).dataSync())
  }

  /**
   * Generates a unique ID.
   * @returns {string}
   */
  public generateUniqueId(): string {
    LoggerService.debug('UtilsController.generateUniqueId()')

    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
  }
}

// ✅ Singleton instance
const utils = UtilsController.getInstance()
export default utils
