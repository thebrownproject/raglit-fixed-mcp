/**
 * Implements the `ChunkRepository` interface using a REST API as the backend.
 * This class handles communication with a remote server to store, search, and filter document chunks.
 */
export class RestApiChunkRepository {
    baseUrl; // Base URL for the REST API.
    apiKey; // Optional API key for authentication with the REST API.
    /**
     * Creates an instance of `RestApiChunkRepository`.
     * @param baseUrl - The base URL of the REST API (e.g., "http://localhost:3000/api").
     * @param apiKey - Optional API key for authenticating requests to the API.
     */
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
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
    async makeRequest(endpoint, method, data) {
        const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`; // Ensure endpoint starts with a slash
        const headers = {
            "Content-Type": "application/json",
        };
        if (this.apiKey) {
            headers["apikey"] = this.apiKey;
        }
        const response = await fetch(url, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error (${response.status}) targeting ${method} ${url}: ${errorText}`);
        }
        // Check if response body is empty before trying to parse JSON
        const responseText = await response.text();
        if (!responseText) {
            return undefined; // Or handle as an empty object {} or null, depending on expected API behavior
        }
        try {
            return JSON.parse(responseText);
        }
        catch (e) {
            throw new Error(`Failed to parse JSON response: ${responseText}`);
        }
    }
    /**
     * Stores a chunk in the database via a POST request to the "/chunks" endpoint of the REST API.
     * @param params - The chunk details to be stored, conforming to `StoreChunkParams`.
     * @returns A Promise that resolves to the ID of the stored chunk, or undefined if the API response doesn't include an ID.
     */
    async storeChunk(params) {
        const response = await this.makeRequest("/rest/v1/chunks", "POST", params);
        return response?.[0]?.id;
    }
    /**
     * Searches for similar chunks by calling the 'match_chunks' RPC function.
     * @param embedding - The embedding vector to search for.
     * @param limit - The maximum number of results to return. This will be passed as 'match_count'.
     * @param metadataFilter - Optional filter, specifically looking for 'documentId' to pass as 'p_document_id'.
     * @param threshold - The similarity threshold for matching, passed as 'match_threshold'.
     * @returns A Promise that resolves to an array of search results (chunks).
     */
    async searchSimilarChunks(embedding, limit = 5, metadataFilter = {}, threshold = 0.7) {
        const rpcParams = {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: limit,
        };
        if (metadataFilter.documentId) {
            rpcParams.p_document_id = metadataFilter.documentId;
        }
        const response = await this.makeRequest("/rest/v1/rpc/match_chunks", "POST", rpcParams);
        return response || [];
    }
    /**
     * Filters chunks by metadata by calling the 'filter_chunks_by_meta' RPC function.
     * @param metadataFilter - The metadata key-value pairs to filter by, passed as 'p_filter_metadata'.
     * @param limit - The maximum number of results to return, passed as 'p_limit'.
     * @returns A Promise that resolves to an array of filtered chunks.
     */
    async filterChunksByMetadata(metadataFilter, limit = 10) {
        const rpcParams = {
            p_filter_metadata: metadataFilter,
            p_limit: limit,
        };
        if (metadataFilter.documentId) {
            rpcParams.p_document_id = metadataFilter.documentId;
        }
        const response = await this.makeRequest("/rest/v1/rpc/filter_chunks_by_meta", "POST", rpcParams);
        return response || [];
    }
}
//# sourceMappingURL=RestApiChunkRepository.js.map