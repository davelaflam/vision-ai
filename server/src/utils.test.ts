import * as tf from '@tensorflow/tfjs-node'

import utils from '@/utils'

jest.mock('@tensorflow/tfjs-node', () => ({
  node: {
    decodeImage: jest.fn(),
  },
  image: {
    resizeBilinear: jest.fn(() => ({
      expandDims: jest.fn(() => ({
        toFloat: jest.fn(() => ({
          div: jest.fn(() => 'mockTensor'),
        })),
      })),
    })),
  },
  tensor: jest.fn(),
  softmax: jest.fn(() => ({
    dataSync: jest.fn(() => [0.2, 0.5, 0.3]),
  })),
  scalar: jest.fn(),
}))

jest.mock('@/services/logger/LoggerService', () => ({
  LoggerService: {
    debug: jest.fn(),
  },
}))

describe('UtilsController', () => {
  describe('preprocessImage()', () => {
    it('should preprocess an image buffer into a normalized tensor', () => {
      const mockBuffer = Buffer.from([255, 0, 0, 255, 0, 0])
      const mockTensor = 'mockTensor'

      const result = utils.preprocessImage(mockBuffer)

      expect(tf.node.decodeImage).toHaveBeenCalledWith(mockBuffer, 3)
      expect(tf.image.resizeBilinear).toHaveBeenCalled()
      expect(result).toBe(mockTensor)
    })
  })

  describe('applySoftmax()', () => {
    it('should apply softmax to logits', () => {
      const logits = [2.0, 1.0, 0.1]

      const result = utils.applySoftmax(logits)

      expect(tf.tensor).toHaveBeenCalledWith(logits)
      expect(tf.softmax).toHaveBeenCalled()
      expect(result).toEqual([0.2, 0.5, 0.3])
    })
  })

  describe('generateUniqueId()', () => {
    it('should generate a unique ID', () => {
      const id1 = utils.generateUniqueId()
      const id2 = utils.generateUniqueId()

      expect(id1).not.toEqual(id2)
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
    })
  })
})
