class TestGraphModel {
  execute(tensor: any) {
    return {
      data: async () => [0.1, 0.2, 0.3],
    }
  }
}

import * as fs from 'fs'

import * as tf from '@tensorflow/tfjs-node'
import * as mobilenet from '@tensorflow-models/mobilenet'
import * as dotenv from 'dotenv'

import { LoggerService } from '../services/logger'
import { EmbeddingController as ECClass } from '../embeddings/EmbeddingsController'

dotenv.config()

jest.mock('@tensorflow/tfjs-node', () => {
  return {
    tensor: jest.fn(() => ({
      expandDims: jest.fn().mockReturnValue({
        data: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      }),
    })),
    loadGraphModel: jest.fn().mockResolvedValue(new TestGraphModel()),
    GraphModel: TestGraphModel,
  }
})

jest.mock('@tensorflow-models/mobilenet', () => ({
  load: jest.fn().mockResolvedValue({
    infer: jest.fn().mockReturnValue({
      data: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    }),
  }),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('../services/logger/LoggerService', () => ({
  LoggerService: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('EmbeddingController', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.USE_CUSTOM_MODEL = 'false'
    Reflect.set(ECClass, 'instance', null)
  })

  afterEach(() => {
    delete process.env.USE_CUSTOM_MODEL
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ECClass.getInstance()
      const instance2 = ECClass.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('loadModel()', () => {
    it('should load the default MobileNet model', async () => {
      await ECClass.getInstance().loadModel()
      expect(mobilenet.load).toHaveBeenCalledTimes(1)
      expect(LoggerService.info).toHaveBeenCalledWith('✅ Default MobileNetV2 Model Loaded Successfully!')
    })
  })

  describe('getModel()', () => {
    it('should return the loaded model', async () => {
      await ECClass.getInstance().loadModel()
      const model = ECClass.getInstance().getModel()
      expect(model).toBeDefined()
    })

    it('should throw an error if model is not loaded', () => {
      Reflect.set(ECClass.getInstance(), 'model', null)
      expect(() => ECClass.getInstance().getModel()).toThrowError(
        '❌ Model not loaded yet! Ensure `loadModel()` is called at startup.',
      )
    })
  })

  describe('getFeatureEmbeddings()', () => {
    it('should generate feature embeddings using default MobileNet', async () => {
      const mockData = new Float32Array([0.1, 0.2, 0.3])
      const dummyTensor = tf.tensor(mockData)
      await ECClass.getInstance().loadModel()
      const embeddings = await ECClass.getInstance().getFeatureEmbeddings(dummyTensor)
      expect(embeddings).toBeDefined()
      expect(embeddings.length).toBeGreaterThan(0)
    })

    it('should generate feature embeddings using custom model', async () => {
      process.env.USE_CUSTOM_MODEL = 'true'
      ;(fs.existsSync as jest.Mock).mockReturnValue(true)
      Reflect.set(ECClass, 'instance', null)
      const instance = ECClass.getInstance()
      const mockData = new Float32Array([0.1, 0.2, 0.3])
      const dummyTensor = tf.tensor(mockData)
      await instance.loadModel()
      const embeddings = await instance.getFeatureEmbeddings(dummyTensor)
      expect(embeddings).toBeDefined()
      expect(embeddings.length).toBeGreaterThan(0)
    })

    it('should throw an error if model is not loaded', async () => {
      Reflect.set(ECClass.getInstance(), 'model', null)
      const dummyTensor = tf.tensor([0.1, 0.2, 0.3])
      await expect(ECClass.getInstance().getFeatureEmbeddings(dummyTensor)).rejects.toThrowError(
        '❌ Model not loaded yet!',
      )
    })
  })
})
