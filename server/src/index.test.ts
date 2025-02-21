import request from 'supertest'
import EmbeddingController from '@/embeddings'
import pineconeController from '@/pinecone'
import { app, loadClassLabels, startServer, server } from './index'

// Mock dependencies
jest.mock('@/embeddings', () => ({
  getModel: jest.fn(),
  getFeatureEmbeddings: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  useCustomModel: true,
  loadModel: jest.fn().mockResolvedValue(true), // Properly mock loadModel
}))
jest.mock('@/pinecone', () => ({
  queryEmbedding: jest.fn().mockResolvedValue([]),
  saveEmbedding: jest.fn().mockResolvedValue(true), // Properly mock saveEmbedding
}))
jest.mock('@/utils', () => ({
  preprocessImage: jest.fn().mockReturnValue('mockedTensor'),
  applySoftmax: jest.fn().mockReturnValue([0.1, 0.2, 0.3]),
}))

// Mock LoggerService to suppress console output during tests
jest.mock('@/services/logger/LoggerService', () => ({
  LoggerService: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

// Force testing port and environment
process.env.PORT = '3001'
process.env.NODE_ENV = 'test'

let testServer: any // Store the server instance

beforeAll(async () => {
  await loadClassLabels()
  testServer = app.listen(process.env.PORT, () => {
    console.log(`Test server running on port ${process.env.PORT}`)
  })
})

afterAll((done) => {
  if (testServer) testServer.close(done) // Close the server properly
})

describe('/train Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if data, label, or user is missing', async () => {
    const response = await request(app).post('/train').send({})

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'Missing data, label, or user!' })
  })

  it('should return 200 if training is successful', async () => {
    ;(EmbeddingController.getFeatureEmbeddings as jest.Mock).mockResolvedValueOnce([0.1, 0.2, 0.3])
    ;(pineconeController.saveEmbedding as jest.Mock).mockResolvedValueOnce(true)

    const response = await request(app).post('/train').send({ data: 'dummyBase64', label: 'cat', user: 'testUser' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ message: 'Training completed successfully!' })
  })
})

describe('/detect Endpoint', () => {
  it('should return 400 if data or user is missing', async () => {
    const response = await request(app).post('/detect').send({})
    expect(response.status).toBe(400)
  })
})
