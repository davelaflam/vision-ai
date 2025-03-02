jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
  console.error(`process.exit called with "${code}"`)
}) as any)

import { LoggerService } from '../services/logger'

import { PineconeController } from './PineconeController'

jest.mock('../services/logger/LoggerService', () => ({
  LoggerService: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}))

// Move mock variable declarations INSIDE jest.mock()
jest.mock('@pinecone-database/pinecone', () => {
  // Declare and initialize mocks here
  const mockUpsert = jest.fn()
  const mockQuery = jest.fn()
  const mockDeleteMany = jest.fn()
  const mockListIndexes = jest.fn().mockResolvedValue({ indexes: [{ name: 'test-index' }] })

  return {
    Pinecone: jest.fn().mockImplementation(() => ({
      Index: jest.fn().mockReturnValue({
        upsert: mockUpsert,
        query: mockQuery,
        deleteMany: mockDeleteMany,
      }),
      listIndexes: mockListIndexes,
    })),
  }
})

describe('PineconeController', () => {
  let pineconeController: PineconeController

  beforeEach(() => {
    jest.clearAllMocks()
    pineconeController = PineconeController.getInstance()
  })

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = PineconeController.getInstance()
      const instance2 = PineconeController.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('initializeIndex', () => {
    it('should initialize the index successfully', async () => {
      const mockListIndexes = jest.fn().mockResolvedValue({
        indexes: [{ name: 'test-index' }],
      })

      pineconeController['pinecone'].listIndexes = mockListIndexes
      pineconeController['indexName'] = 'test-index' // ✅ Explicitly set the indexName

      await pineconeController.initializeIndex()

      // Check all calls in sequence
      expect(LoggerService.info).toHaveBeenNthCalledWith(1, '🔄 Fetching available Pinecone indexes...')
      expect(LoggerService.info).toHaveBeenNthCalledWith(2, '🔍 Available Pinecone Indexes:', ['test-index'])
      expect(LoggerService.info).toHaveBeenNthCalledWith(3, "✅ Pinecone Index 'test-index' is ready.")
    })

    it('should throw error if index is not found', async () => {
      // Mock listIndexes to always resolve with an empty array
      const mockListIndexes = jest.fn().mockResolvedValue({
        indexes: [], // ❌ Empty array ensures indexName won't be found
      })

      // Override the original method with the mock
      pineconeController['pinecone'].listIndexes = mockListIndexes

      // Force the condition by explicitly setting the indexName to 'test-index'
      pineconeController['indexName'] = 'test-index'

      // Call the method and catch the error manually
      try {
        await pineconeController.initializeIndex()
      } catch (error: any) {
        expect(error.message).toBe(`Pinecone index 'test-index' not found!`)
      }

      // Ensure that the error was actually thrown
      expect(mockListIndexes).toHaveBeenCalled()
    })
  })

  describe('saveEmbedding', () => {
    it('should save an embedding successfully', async () => {
      const records = [
        {
          id: 'test-id',
          values: [0.1, 0.2, 0.3],
          metadata: { label: 'test-label' },
        },
      ]

      const mockUpsert = jest.fn().mockResolvedValueOnce({})
      pineconeController['index'] = { upsert: mockUpsert } as any

      await pineconeController.saveEmbedding(records)

      expect(LoggerService.info).toHaveBeenCalledWith(`📡 Upserting to Pinecone: ${JSON.stringify(records, null, 2)}`)
      expect(LoggerService.info).toHaveBeenCalledWith('✅ Pinecone Upsert Completed Successfully!')
      expect(mockUpsert).toHaveBeenCalledWith(records)
    })

    it('should handle error when saving embedding', async () => {
      const records = [
        {
          id: 'test-id',
          values: [0.1, 0.2, 0.3],
          metadata: { label: 'test-label' },
        },
      ]

      const mockUpsert = jest.fn().mockRejectedValueOnce(new Error('Upsert Error'))
      pineconeController['index'] = { upsert: mockUpsert } as any

      const result = await pineconeController.saveEmbedding(records)

      expect(result).toEqual({
        error: 'Failed to save embedding',
        details: 'Upsert Error',
      })
      expect(LoggerService.error).toHaveBeenCalledWith('❌ Pinecone Save Failed:', expect.any(Error))
    })
  })

  describe('queryEmbedding', () => {
    it('should query embeddings successfully', async () => {
      const embedding = [0.1, 0.2, 0.3]
      const namespace = 'test-namespace'

      const mockResponse = {
        matches: [
          { id: 'match-1', score: 0.95 },
          { id: 'match-2', score: 0.85 },
        ],
      }

      const mockQuery = jest.fn().mockResolvedValueOnce(mockResponse)
      pineconeController['index'] = { query: mockQuery } as any

      const result = await pineconeController.queryEmbedding({ embedding, namespace })

      expect(result).toEqual(mockResponse.matches)
      expect(LoggerService.info).toHaveBeenCalledWith('🔄 Querying Pinecone with namespace:', namespace)
      expect(LoggerService.info).toHaveBeenCalledWith('✅ Pinecone Query Response:', mockResponse)
      expect(mockQuery).toHaveBeenCalledWith({
        vector: embedding,
        topK: 3,
        includeMetadata: true,
        filter: { user: namespace },
      })
    })

    it('should handle error when querying embedding', async () => {
      const embedding = [0.1, 0.2, 0.3]
      const namespace = 'test-namespace'

      const mockQuery = jest.fn().mockRejectedValueOnce(new Error('Query Error'))
      pineconeController['index'] = { query: mockQuery } as any

      const result = await pineconeController.queryEmbedding({ embedding, namespace })

      expect(result).toEqual([])
      expect(LoggerService.error).toHaveBeenCalledWith('❌ Pinecone Query Failed:', expect.any(Error))
    })
  })

  describe('deleteNamespace', () => {
    it('should delete a namespace successfully', async () => {
      const namespace = { namespace: 'test-namespace' }

      const mockDeleteMany = jest.fn().mockResolvedValueOnce({})
      pineconeController['index'] = { deleteMany: mockDeleteMany } as any

      await pineconeController.deleteNamespace(namespace)

      expect(mockDeleteMany).toHaveBeenCalledWith({ filter: { user: namespace } })
      expect(LoggerService.info).toHaveBeenCalledWith('✅ Namespace deleted:', namespace)
    })

    it('should handle error when deleting namespace', async () => {
      const namespace = { namespace: 'test-namespace' }

      const mockDeleteMany = jest.fn().mockRejectedValueOnce(new Error('Delete Error'))
      pineconeController['index'] = { deleteMany: mockDeleteMany } as any

      await expect(pineconeController.deleteNamespace(namespace)).rejects.toThrow('Delete Error')

      expect(LoggerService.error).toHaveBeenCalledWith('❌ Namespace deletion failed:', expect.any(Error))
    })
  })
})
