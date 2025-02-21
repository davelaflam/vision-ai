import { Index, Pinecone, RecordMetadata } from '@pinecone-database/pinecone'
import dotenv from 'dotenv'

import { LoggerService } from '@/services/logger/LoggerService'

dotenv.config()

/**
 * Class to manage Pinecone operations using Singleton pattern
 */
export class PineconeController {
  private static instance: PineconeController
  private pinecone: Pinecone
  public static index: ReturnType<Pinecone['Index']> | null = null
  private readonly apiKey: string
  private indexName: string
  private index: Index<RecordMetadata> | undefined

  public constructor() {
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
   * 🚀 Save an embedding vector to Pinecone
   * @param records Array of records to save
   * @returns {Promise<any>} Pinecone save response
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

      console.log('📡 Upserting to Pinecone:', records) // ✅ Debug log
      LoggerService.info(`📡 Upserting to Pinecone: ${JSON.stringify(records, null, 2)}`) // ✅ Debug log

      await this.index.upsert(records)

      LoggerService.info('✅ Pinecone Upsert Completed Successfully!')
      return { success: true }
    } catch (error: any) {
      LoggerService.error('❌ Pinecone Save Failed:', error)
      return { error: 'Failed to save embedding', details: error.message }
    }
  }

  /**
   * 🚀 Query Pinecone for similar embeddings
   * @param embedding Embedding vector to query
   * @param namespace Namespace to filter by
   * @param topK Number of top results to return
   * @returns {Promise<any[]>} Array of matching records
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

      const queryResponse = await this.index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
        filter: namespace ? { user: namespace } : undefined,
      })

      LoggerService.info('✅ Pinecone Query Response:', queryResponse)
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
    LoggerService.debug('🌲 PineconeController.deleteNamespace()', namespace)

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

/**
 * ✅ Ensure proper initialization before exporting
 */
const pineconeController = PineconeController.getInstance()

async function initialize() {
  try {
    await pineconeController.initializeIndex()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
    LoggerService.error('❌ Pinecone Initialization Failed:', errorMessage)
    process.exit(1)
  }
}

initialize().catch((err) => {
  LoggerService.error('❌ Uncaught error during Pinecone initialization:', err)
  throw new Error('Failed to initialize Pinecone')
})

export default pineconeController
