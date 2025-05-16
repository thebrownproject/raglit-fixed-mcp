import { ChunkRepository, StoreChunkParams } from "./ChunkRepository.js";

/**
 * Implements the `ChunkRepository` interface using a REST API as the backend.
 * This class handles communication with a remote server to store, search, and filter document chunks.
 */
export class RestApiChunkRepository implements ChunkRepository {
  private baseUrl: string; // Base URL for the REST API.
  private apiKey?: string; // Optional API key for authentication with the REST API.

  /**
   * Creates an instance of `RestApiChunkRepository`.
   * @param baseUrl - The base URL of the REST API (e.g., "http://localhost:3000/api").
   * @param apiKey - Optional API key for authenticating requests to the API.
   */
  constructor(baseUrl: string, apiKey?: string) {
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
  private async makeRequest(
    endpoint: string,
    method: string,
    data?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${
      endpoint.startsWith("/") ? endpoint : "/" + endpoint
    }`; // Ensure endpoint starts with a slash

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API error (${response.status}) targeting ${method} ${url}: ${errorText}`
      );
    }

    // Check if response body is empty before trying to parse JSON
    const responseText = await response.text();
    if (!responseText) {
      return undefined; // Or handle as an empty object {} or null, depending on expected API behavior
    }
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Failed to parse JSON response: ${responseText}`);
    }
  }

  /**
   * Stores a chunk in the database via a POST request to the "/chunks" endpoint of the REST API.
   * @param params - The chunk details to be stored, conforming to `StoreChunkParams`.
   * @returns A Promise that resolves to the ID of the stored chunk, or undefined if the API response doesn't include an ID.
   */
  async storeChunk(params: StoreChunkParams): Promise<string | undefined> {
    const response = await this.makeRequest("/chunks", "POST", params);
    return response?.id; // Safely access id, as response might be undefined
  }

  /**
   * Searches for similar chunks by sending a POST request to the "/chunks/search" endpoint.
   * @param embedding - The embedding vector to search for.
   * @param limit - The maximum number of results to return. Defaults to 5.
   * @param metadataFilter - Optional filter to apply based on chunk metadata. Defaults to an empty object.
   * @param threshold - The similarity threshold for matching. Defaults to 0.7.
   * @returns A Promise that resolves to an array of search results (chunks), or an empty array if no results or API issues.
   */
  async searchSimilarChunks(
    embedding: number[],
    limit = 5,
    metadataFilter: Record<string, any> = {},
    threshold = 0.7
  ): Promise<any[]> {
    const response = await this.makeRequest("/chunks/search", "POST", {
      embedding,
      limit,
      metadataFilter,
      threshold,
    });
    return response?.results || []; // Safely access results, default to empty array
  }

  /**
   * Filters chunks by metadata by sending a POST request to the "/chunks/filter" endpoint.
   * @param metadataFilter - The metadata key-value pairs to filter by.
   * @param limit - The maximum number of results to return. Defaults to 10.
   * @returns A Promise that resolves to an array of filtered chunks, or an empty array if no results or API issues.
   */
  async filterChunksByMetadata(
    metadataFilter: Record<string, any>,
    limit = 10
  ): Promise<any[]> {
    const response = await this.makeRequest("/chunks/filter", "POST", {
      metadataFilter,
      limit,
    });
    return response?.results || []; // Safely access results, default to empty array
  }
}
