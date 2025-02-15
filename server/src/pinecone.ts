import { Pinecone } from '@pinecone-database/pinecone'
import dotenv from 'dotenv'

import { LoggerService } from './services/logger/LoggerService.js'

dotenv.config()

/**
 * Class to manage Pinecone operations using Singleton pattern
 */
class PineconeController {
  private static instance: PineconeController
  private pinecone: Pinecone
  private index: ReturnType<Pinecone['Index']> | null = null
  private readonly apiKey: string
  private readonly indexName: string

  private constructor() {
    this.apiKey = process.env.PINECONE_API_KEY || ''
    this.indexName = process.env.PINECONE_INDEX_NAME || ''

    if (!this.apiKey) {
      throw new Error('❌ PINECONE_API_KEY is missing! Check your .env file.')
    }
    if (!this.indexName) {
      throw new Error('❌ PINECONE_INDEX_NAME is missing! Check your .env file.')
    }

    this.pinecone = new Pinecone({ apiKey: this.apiKey })
  }

  /**
   * Get Singleton Instance
   * @returns {PineconeController}
   */
  public static getInstance(): PineconeController {
    LoggerService.debug('🌲 PineconeController.getInstance()')

    if (!PineconeController.instance) {
      PineconeController.instance = new PineconeController()
    }
    return PineconeController.instance
  }

  /**
   * 🚀 Initialize Pinecone Index
   * @returns {Promise<void>}
   */
  public async initializeIndex(): Promise<void> {
    LoggerService.debug('🌲 PineconeController.initializeIndex()')

    try {
      LoggerService.info('🔄 Fetching available Pinecone indexes...')
      const indexData = await this.pinecone.listIndexes()

      if (!indexData.indexes) {
        throw new Error('❌ ERROR: Pinecone indexes could not be retrieved.')
      }

      const indexNames = indexData.indexes.map((idx) => idx.name)
      LoggerService.info('🔍 Available Pinecone Indexes:', indexNames)

      if (!indexNames.includes(this.indexName)) {
        throw new Error(`Pinecone index '${this.indexName}' not found!`)
      }

      this.index = this.pinecone.Index(this.indexName)
      LoggerService.info(`✅ Pinecone Index '${this.indexName}' is ready.`)
    } catch (error) {
      LoggerService.error('❌ ERROR: Failed to initialize Pinecone:', JSON.stringify(error))
      process.exit(1)
    }
  }

  /**
   * 🚀 Save an embedding vector to Pinecone with namespace
   * @param records Array of records with ID, values, and metadata
   * @returns {Promise<any>}
   */
  public async saveEmbedding(
    records: Array<{ id: string; values: number[]; metadata: Record<string, any> }>,
  ): Promise<any> {
    LoggerService.debug('🌲 PineconeController.saveEmbedding()')

    try {
      LoggerService.info('🚀 Saving Embedding')

      if (!this.index) {
        throw new Error('❌ ERROR: Pinecone Index is undefined.')
      }

      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('❌ ERROR: No valid records to upsert.')
      }

      const response = await this.index.upsert(records)
      LoggerService.info('✅ Pinecone Upsert Response:', JSON.stringify(response))

      return response
    } catch (error: any) {
      LoggerService.error('❌ Pinecone Save Failed:', error)
      return { error: 'Failed to save embedding', details: error.message }
    }
  }

  /**
   * 🚀 Query Pinecone for similar embeddings (Ensuring namespace works)
   * @param embedding Array of numbers representing the embedding
   * @param namespace Namespace to filter by
   * @param topK Number of similar embeddings to return
   * @returns {Promise<any[]>}
   */
  public async queryEmbedding({
    embedding,
    namespace,
    topK = 3,
  }: {
    embedding: number[]
    namespace?: string
    topK?: number
  }): Promise<any[]> {
    LoggerService.debug('🌲 PineconeController.queryEmbedding()')

    try {
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('❌ ERROR: Invalid embedding for Pinecone query.')
      }

      if (!this.index) {
        throw new Error('❌ ERROR: Pinecone Index is undefined.')
      }

      LoggerService.info('🔄 Querying Pinecone with namespace:', namespace || 'default')

      // ✅ Fix: `namespace` must be passed inside `filter`, not as a second argument
      const queryResponse = await this.index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
        filter: namespace ? { user: namespace } : undefined, // ✅ Correct way to filter by user
      })

      LoggerService.info('✅ Pinecone Query Response:', JSON.stringify(queryResponse, null, 2))
      return queryResponse.matches || []
    } catch (error: any) {
      LoggerService.error('❌ Pinecone Query Failed:', error)
      return []
    }
  }

  /**
   * 🚀 Delete a namespace in Pinecone
   * @param namespace Namespace to delete
   * @returns {Promise<void>}
   */
  public async deleteNamespace(namespace: { namespace: string }): Promise<void> {
    LoggerService.debug('🌲 PineconeController.deleteNamespace()')

    try {
      if (!this.index) {
        throw new Error('❌ ERROR: Pinecone Index is undefined.')
      }

      // ✅ Correct Pinecone deletion method (delete all vectors in namespace)
      await this.index.deleteMany({ filter: { user: namespace } })

      LoggerService.info('✅ Namespace deleted:', namespace)
    } catch (error: any) {
      LoggerService.error('❌ Namespace deletion failed:', error)
      throw error
    }
  }
}

// ✅ Singleton instance
const pineconeManager = PineconeController.getInstance()
await pineconeManager.initializeIndex()

export default pineconeManager
