import { ChunkRepository, StoreChunkParams } from "./ChunkRepository.js";
/**
 * Implements the `ChunkRepository` interface using a REST API as the backend.
 * This class handles communication with a remote server to store, search, and filter document chunks.
 */
export declare class RestApiChunkRepository implements ChunkRepository {
    private baseUrl;
    private apiKey?;
    /**
     * Creates an instance of `RestApiChunkRepository`.
     * @param baseUrl - The base URL of the REST API (e.g., "http://localhost:3000/api").
     * @param apiKey - Optional API key for authenticating requests to the API.
     */
    constructor(baseUrl: string, apiKey?: string);
    /**
     * A private helper method to make HTTP requests to the configured REST API.
     * It handles setting headers, including an Authorization header if an API key is provided,
     * and processes the response, throwing an error for non-successful status codes.
     *
     * @param endpoint - The specific API endpoint to target (e.g., "/chunks", "/chunks/search").
     * @param method - The HTTP method to use (e.g., "GET", "POST", "PUT").
     * @param data - Optional data to be sent in the request body, typically for POST or PUT requests.
     * @returns A Promise that resolves to the JSON parsed response from the API.
     * @throws Error if the API request fails or returns a non-ok status.
     */
    private makeRequest;
    /**
     * Stores a chunk in the database via a POST request to the "/chunks" endpoint of the REST API.
     * @param params - The chunk details to be stored, conforming to `StoreChunkParams`.
     * @returns A Promise that resolves to the ID of the stored chunk, or undefined if the API response doesn't include an ID.
     */
    storeChunk(params: StoreChunkParams): Promise<string | undefined>;
    /**
     * Searches for similar chunks by calling the 'match_chunks' RPC function.
     * @param embedding - The embedding vector to search for.
     * @param limit - The maximum number of results to return. This will be passed as 'match_count'.
     * @param metadataFilter - Optional filter, specifically looking for 'documentId' to pass as 'p_document_id'.
     * @param threshold - The similarity threshold for matching, passed as 'match_threshold'.
     * @returns A Promise that resolves to an array of search results (chunks).
     */
    searchSimilarChunks(embedding: number[], limit?: number, metadataFilter?: Record<string, any>, threshold?: number): Promise<any[]>;
    /**
     * Filters chunks by metadata by calling the 'filter_chunks_by_meta' RPC function.
     * @param metadataFilter - The metadata key-value pairs to filter by, passed as 'p_filter_metadata'.
     * @param limit - The maximum number of results to return, passed as 'p_limit'.
     * @returns A Promise that resolves to an array of filtered chunks.
     */
    filterChunksByMetadata(metadataFilter: Record<string, any>, limit?: number): Promise<any[]>;
}
