/**
 * Retrieves an embedding for a given text string using an external embedding service.
 *
 * This implementation utilizes the OpenAI embeddings API by default, configured via `src/config.ts`.
 * It can be adapted to use other embedding services if required.
 *
 * @param text The text string to get an embedding for.
 * @returns A Promise that resolves to an array of numbers representing the embedding vector.
 * @throws Error if the API key is not configured, if the request fails, or if it times out.
 */
export declare function getEmbedding(text: string): Promise<number[]>;
