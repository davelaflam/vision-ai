jest.mock('../utils/UtilsController', () => ({
  __esModule: true,
  default: {
    preprocessImage: jest.fn(),
    generateUniqueId: jest.fn(),
  },
}))

jest.mock('../embeddings/EmbeddingsController', () => ({
  __esModule: true,
  default: {
    getFeatureEmbeddings: jest.fn(),
  },
}))

jest.mock('@/pinecone/PineconeController', () => {
  const actualModule = jest.requireActual('@/pinecone/PineconeController')
  return {
    __esModule: true,
    ...actualModule,
    default: {
      ...actualModule.default,
      saveEmbedding: jest.fn(),
      queryEmbedding: jest.fn(),
    },
  }
})

import { Request, Response } from 'express'

import EmbeddingController from '../embeddings/EmbeddingsController'
import pineconeController from '../pinecone/PineconeController'
import UtilsController from '../utils/UtilsController'

import { handleImage, handleDeleteUser } from './handlers'

describe('Handlers', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      body: {},
      query: {},
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    jest.clearAllMocks()
  })

  describe('handleImage', () => {
    it('should return 400 if data, user, or stage is missing', async () => {
      req.body = { user: 'user1', stage: 'train' } // Missing data
      await handleImage(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields: data, user, stage.',
      })
    })

    it('should process image and extract feature embeddings', async () => {
      req.body = { data: 'imageData', user: 'user1', stage: 'train', label: 'label1' }

      const mockTensor = { shape: [3, 224, 224] }
      const mockEmbedding = Array(768).fill(0.1)
      const mockUniqueId = 'unique-id'

      const expectedId: string = `${req.body.label}-${mockUniqueId}`

      ;(UtilsController.preprocessImage as jest.Mock).mockReturnValue(mockTensor)
      ;(EmbeddingController.getFeatureEmbeddings as jest.Mock).mockResolvedValue(mockEmbedding)
      ;(UtilsController.generateUniqueId as jest.Mock).mockReturnValue(mockUniqueId)

      const saveEmbeddingMock = pineconeController.saveEmbedding as jest.Mock
      saveEmbeddingMock.mockResolvedValue(true)

      await handleImage(req as Request, res as Response)

      expect(UtilsController.preprocessImage).toHaveBeenCalledWith(expect.any(Buffer))
      expect(EmbeddingController.getFeatureEmbeddings).toHaveBeenCalledWith(mockTensor)
      expect(saveEmbeddingMock).toHaveBeenCalledWith([
        {
          id: expectedId,
          values: mockEmbedding,
          metadata: { label: req.body.label },
          namespace: req.body.user,
        },
      ])

      expect(res.json).toHaveBeenCalledWith({
        message: 'Training success',
        id: expectedId,
      })

      // Debugging Logs
      console.log('saveEmbedding calls:', saveEmbeddingMock.mock.calls)
    })

    it('should query embeddings when stage is detect', async () => {
      req.body = { data: 'imageData', user: 'user1', stage: 'detect' }

      const mockTensor = { shape: [3, 224, 224] }
      const mockEmbedding = Array(768).fill(0.1)
      const mockQueryResult = [{ id: 'result1', score: 0.9 }]

      ;(UtilsController.preprocessImage as jest.Mock).mockReturnValue(mockTensor)
      ;(EmbeddingController.getFeatureEmbeddings as jest.Mock).mockResolvedValue(mockEmbedding)
      ;(pineconeController.queryEmbedding as jest.Mock).mockResolvedValue(mockQueryResult)

      await handleImage(req as Request, res as Response)

      expect(UtilsController.preprocessImage).toHaveBeenCalledWith(expect.any(Buffer))
      expect(EmbeddingController.getFeatureEmbeddings).toHaveBeenCalledWith(mockTensor)
      expect(pineconeController.queryEmbedding).toHaveBeenCalledWith({
        embedding: mockEmbedding,
        namespace: req.body.user,
        topK: 5,
      })
      expect(res.json).toHaveBeenCalledWith({
        message: 'Detection success',
        results: mockQueryResult,
      })
    })

    it('should return 400 for invalid stage', async () => {
      req.body = { data: 'imageData', user: 'user1', stage: 'invalid' }
      await handleImage(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid stage specified.',
      })
    })

    it('should handle errors gracefully and return 500', async () => {
      req.body = { data: 'imageData', user: 'user1', stage: 'train', label: 'label1' }
      ;(UtilsController.preprocessImage as jest.Mock).mockImplementation(() => {
        throw new Error('Processing error')
      })
      await handleImage(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Server error',
        message: 'Processing error',
      })
    })
  })

  describe('handleDeleteUser', () => {
    it('should return 400 if user is missing', async () => {
      req.query = {}
      await handleDeleteUser(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'missing user' })
    })

    it('should delete user namespace when user is provided', async () => {
      req.query = { user: 'testUser' }
      pineconeController.deleteNamespace = jest.fn().mockResolvedValue(true)
      await handleDeleteUser(req as Request, res as Response)
      expect(pineconeController.deleteNamespace).toHaveBeenCalledWith({ namespace: expect.any(String) })
      expect(res.json).toHaveBeenCalledWith({ message: 'success' })
    })

    it('should handle errors gracefully and return 500', async () => {
      req.query = { user: 'testUser' }
      pineconeController.deleteNamespace = jest.fn().mockImplementation(() => {
        throw new Error('Delete error')
      })
      await handleDeleteUser(req as Request, res as Response)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: 'failed to delete user namespace' })
    })
  })
})
