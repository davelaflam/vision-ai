import * as tf from '@tensorflow/tfjs-node'
import * as mobilenet from '@tensorflow-models/mobilenet'

import { LoggerService } from '../services/logger'
import EmbeddingController from '../embeddings/EmbeddingsController'

// ✅ Properly Mock TensorFlow's loadGraphModel without requireActual
jest.mock('@tensorflow/tfjs-node', () => ({
  tensor: jest.fn(() => ({
    expandDims: jest.fn().mockReturnValue({
      data: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    }),
  })),
  loadGraphModel: jest.fn().mockResolvedValue({
    execute: jest.fn().mockReturnValue({
      data: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    }),
  }),
}))

// ✅ Mock MobileNet
jest.mock('@tensorflow-models/mobilenet', () => ({
  load: jest.fn().mockResolvedValue({
    infer: jest.fn().mockReturnValue({
      data: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    }),
  }),
}))

// ✅ Mock File System
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

// ✅ Mock LoggerService to avoid console noise
jest.mock('../services/logger/LoggerService', () => ({
  LoggerService: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('EmbeddingController', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // ✅ Reset Singleton Instance
    const realInstance = Reflect.get(EmbeddingController, 'instance')
    Reflect.set(EmbeddingController, 'instance', null)
  })

  afterEach(() => {
    // ✅ Cleanup environment variables to avoid test pollution
    delete process.env.USE_CUSTOM_MODEL
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EmbeddingController
      const instance2 = EmbeddingController
      expect(instance1).toBe(instance2)
    })
  })

  describe('loadModel()', () => {
    it('should load the default MobileNet model', async () => {
      await EmbeddingController.loadModel()
      expect(mobilenet.load).toHaveBeenCalledTimes(1)
      expect(LoggerService.info).toHaveBeenCalledWith('✅ Default MobileNetV2 Model Loaded Successfully!')
    })
  })

  describe('getModel()', () => {
    it('should return the loaded model', async () => {
      await EmbeddingController.loadModel()
      const model = EmbeddingController.getModel()

      expect(model).toBeDefined()
    })

    it('should throw an error if model is not loaded', () => {
      // ✅ Ensure model is unset
      Reflect.set(EmbeddingController, 'model', null)

      expect(() => EmbeddingController.getModel()).toThrowError(
        '❌ Model not loaded yet! Ensure `loadModel()` is called at startup.',
      )
    })
  })

  describe('getFeatureEmbeddings()', () => {
    it('should generate feature embeddings using default MobileNet', async () => {
      // ✅ Declare mockData in the correct scope
      const mockData = new Float32Array([0.1, 0.2, 0.3])
      const dummyTensor = tf.tensor(mockData) // ✅ Corrected Syntax

      await EmbeddingController.loadModel()
      const embeddings = await EmbeddingController.getFeatureEmbeddings(dummyTensor)

      expect(embeddings).toBeDefined()
      expect(embeddings.length).toBeGreaterThan(0)
    })

    it('should generate feature embeddings using custom model', async () => {
      process.env.USE_CUSTOM_MODEL = 'true'

      // ✅ Declare mockData here as well
      const mockData = new Float32Array([0.1, 0.2, 0.3])
      const dummyTensor = tf.tensor(mockData) // ✅ Corrected Syntax

      await EmbeddingController.loadModel()
      const embeddings = await EmbeddingController.getFeatureEmbeddings(dummyTensor)

      expect(embeddings).toBeDefined()
      expect(embeddings.length).toBeGreaterThan(0)
    })

    it('should throw an error if model is not loaded', async () => {
      // ✅ Ensure model is unset
      Reflect.set(EmbeddingController, 'model', null)
      const dummyTensor = tf.tensor([0.1, 0.2, 0.3])

      await expect(EmbeddingController.getFeatureEmbeddings(dummyTensor)).rejects.toThrowError(
        '❌ Model not loaded yet!',
      )
    })
  })
})
