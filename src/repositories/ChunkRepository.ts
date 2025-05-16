/**
 * Interface defining the parameters for storing a single document chunk.
 * This structure is used when adding a new chunk to the repository.
 */
export interface StoreChunkParams {
  content: string; // The textual content of the chunk.
  embedding: number[]; // The vector embedding of the chunk's content.
  documentId: string; // The ID of the original document this chunk belongs to.
  chunkIndex: number; // The sequential index of this chunk within the document.
  chunkSize: number; // The size of the chunk (e.g., in characters or tokens).
  chunkOverlap: number; // The overlap with the previous/next chunk.
  chunkStrategy: string; // The strategy used to create this chunk (e.g., "fixed-size").
  metadata?: Record<string, any>; // Optional metadata associated with the chunk.
}

/**
 * Defines the contract for a chunk repository.
 * A chunk repository is responsible for storing, retrieving, and searching document chunks.
 */
export interface ChunkRepository {
  /**
   * Stores a single document chunk in the repository.
   * @param params - An object containing the details of the chunk to be stored.
   * @returns A Promise that resolves to the unique ID of the stored chunk, or undefined if storage fails.
   */
  storeChunk(params: StoreChunkParams): Promise<string | undefined>;

  /**
   * Searches for chunks that are semantically similar to a given embedding vector.
   * @param embedding - The embedding vector to search against.
   * @param limit - Optional. The maximum number of similar chunks to return. Defaults to a repository-specific value.
   * @param metadataFilter - Optional. A record of metadata key-value pairs to filter the search results.
   * @param threshold - Optional. A similarity threshold (e.g., 0 to 1) for matching chunks. Defaults to a repository-specific value.
   * @returns A Promise that resolves to an array of chunk objects that match the search criteria.
   */
  searchSimilarChunks(
    embedding: number[],
    limit?: number,
    metadataFilter?: Record<string, any>,
    threshold?: number
  ): Promise<any[]>;

  /**
   * Filters chunks based on exact matches of provided metadata key-value pairs.
   * @param metadataFilter - A record of metadata key-value pairs to filter by. At least one pair must be provided.
   * @param limit - Optional. The maximum number of filtered chunks to return. Defaults to a repository-specific value.
   * @returns A Promise that resolves to an array of chunk objects that match the metadata filter.
   */
  filterChunksByMetadata(
    metadataFilter: Record<string, any>,
    limit?: number
  ): Promise<any[]>; // Corrected return type
}
