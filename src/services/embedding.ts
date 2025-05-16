import { loadConfig } from "../config.js"; // Import centralized configuration loader

// Default timeout for embedding API requests in milliseconds
// This could also be moved to AppConfig if more dynamic configuration is needed.
const DEFAULT_EMBEDDING_TIMEOUT = 10000;

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
export async function getEmbedding(text: string): Promise<number[]> {
  // Load configuration which includes API keys and model names
  const config = loadConfig();

  const { apiKey: openAiApiKey, model: embeddingModel } = config.embedding;

  if (!openAiApiKey) {
    throw new Error(
      "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables."
    );
  }

  try {
    // Use AbortController for request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      DEFAULT_EMBEDDING_TIMEOUT
    );

    // Make the request to the OpenAI embeddings API endpoint
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        input: text, // The text to embed
        model: embeddingModel, // The embedding model to use, from config
      }),
      signal: controller.signal, // Signal for aborting the request on timeout
    });

    clearTimeout(timeoutId); // Clear the timeout as the request has completed (or failed)

    if (!response.ok) {
      // Attempt to parse error details from the API response
      let errorDetails = "Unknown error";
      try {
        const errorResponse = await response.json();
        errorDetails =
          errorResponse.error?.message || JSON.stringify(errorResponse);
      } catch (parseError) {
        // If parsing fails, use the raw text response
        errorDetails = await response.text();
      }
      throw new Error(`OpenAI API error (${response.status}): ${errorDetails}`);
    }

    // Parse the successful response
    const result = await response.json();

    // Ensure the expected data structure is present
    if (result.data && result.data.length > 0 && result.data[0].embedding) {
      return result.data[0].embedding;
    } else {
      throw new Error("Invalid response structure from OpenAI API.");
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      // Handle specifically the timeout error
      throw new Error(
        `Embedding request timed out after ${DEFAULT_EMBEDDING_TIMEOUT}ms`
      );
    }
    // Re-throw other errors
    throw error;
  }
}
