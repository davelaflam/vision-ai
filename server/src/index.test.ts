import request = require('supertest')

import EmbeddingController from './embeddings/EmbeddingsController'
import pineconeController from './pinecone/PineconeController'

import { app, loadClassLabels } from './index'

// Mock dependencies
jest.mock('./embeddings/EmbeddingsController', () => ({
  getModel: jest.fn(),
  useCustomModel: true,
  getFeatureEmbeddings: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  loadModel: jest.fn().mockResolvedValue(true),
}))
jest.mock('./pinecone/PineconeController', () => ({
  queryEmbedding: jest.fn().mockResolvedValue([]),
  saveEmbedding: jest.fn().mockResolvedValue(true),
}))
jest.mock('./utils/UtilsController', () => ({
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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if data or user is missing', async () => {
    const response = await request(app).post('/detect').send({})
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'Missing image or user!' })
  })

  it('should return 500 if model is not loaded', async () => {
    ;(EmbeddingController.getModel as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Model not loaded yet!')
    })

    const response = await request(app).post('/detect').send({ data: 'dummyBase64', user: 'testUser' })

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: 'Model not loaded yet!' })
  })

  it('should return 500 if predictions are invalid', async () => {
    ;(EmbeddingController.getModel as jest.Mock).mockReturnValue({
      execute: jest.fn().mockReturnValue({
        array: jest.fn().mockResolvedValue([]), // Return an empty array
      }),
    })

    const response = await request(app).post('/detect').send({ data: 'dummyBase64', user: 'testUser' })

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: 'Invalid predictions from model' })
  })

  it('should return 500 if model type is unknown', async () => {
    ;(EmbeddingController.getModel as jest.Mock).mockReturnValue({})

    const response = await request(app).post('/detect').send({ data: 'dummyBase64', user: 'testUser' })

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: 'Detection failed!', details: '❌ Model type is unknown!' })
  })

  it('should return 200 with Unknown Object if no Pinecone results', async () => {
    ;(EmbeddingController.getModel as jest.Mock).mockReturnValue({
      execute: jest.fn().mockReturnValue({
        array: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
      }),
    })
    ;(pineconeController.queryEmbedding as jest.Mock).mockResolvedValueOnce([])

    const response = await request(app).post('/detect').send({ data: 'dummyBase64', user: 'testUser' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ detectedLabel: 'Unknown Object', confidence: '0%' })
  })

  it('should return 200 with matches if Pinecone results are found', async () => {
    ;(EmbeddingController.getModel as jest.Mock).mockReturnValue({
      execute: jest.fn().mockReturnValue({
        array: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
      }),
    })
    ;(pineconeController.queryEmbedding as jest.Mock).mockResolvedValueOnce([
      { metadata: { label: 'Cat' }, score: 0.95 },
      { metadata: { label: 'Dog' }, score: 0.85 },
    ])

    const response = await request(app).post('/detect').send({ data: 'dummyBase64', user: 'testUser' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      matches: [
        { label: 'Cat', confidence: '95.00%' },
        { label: 'Dog', confidence: '85.00%' },
      ],
    })
  })

  it('should return 500 if an unexpected error occurs', async () => {
    // Mock getModel to return a valid model to bypass the middleware
    ;(EmbeddingController.getModel as jest.Mock).mockReturnValue({
      execute: jest.fn().mockImplementationOnce(() => {
        throw new Error('Unexpected error!')
      }),
    })

    const response = await request(app).post('/detect').send({ data: 'dummyBase64', user: 'testUser' })

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: 'Detection failed!', details: 'Unexpected error!' })
  })
})
