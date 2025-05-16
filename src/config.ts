// src/config.ts
import dotenv from "dotenv";

// Load environment variables from a .env file into process.env
dotenv.config();

/**
 * Defines the structure for the application's configuration.
 * This interface ensures that all necessary configuration values are present and correctly typed.
 */
export interface AppConfig {
  /** Configuration for the main API used by the RestApiChunkRepository. */
  api: {
    /** The base URL of the API. This is a required environment variable (API_BASE_URL). */
    baseUrl: string;
    /** Optional API key for authenticating with the API (API_KEY). */
    apiKey?: string;
  };
  /** Configuration for the embedding service (e.g., OpenAI). */
  embedding: {
    /** API key for the embedding service. This is a required environment variable (OPENAI_API_KEY). */
    apiKey: string;
    /** The model to be used for generating embeddings (EMBEDDING_MODEL). Defaults to 'text-embedding-3-small'. */
    model: string;
  };
}

/**
 * Loads and validates the application configuration from environment variables.
 * It checks for the presence of required variables and provides default values for optional ones.
 *
 * @returns An `AppConfig` object containing the loaded and validated configuration.
 * @throws Error if required environment variables (API_BASE_URL, OPENAI_API_KEY) are not set.
 */
export function loadConfig(): AppConfig {
  // Validate and retrieve API_BASE_URL
  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error(
      "API_BASE_URL environment variable is required. This is the base URL for your chunk storage and search API."
    );
  }

  // Validate and retrieve OPENAI_API_KEY
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (!openAiApiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required for generating embeddings."
    );
  }

  // Construct and return the configuration object
  return {
    api: {
      baseUrl: apiBaseUrl,
      apiKey: process.env.API_KEY, // Optional: API key for the main API
    },
    embedding: {
      apiKey: openAiApiKey, // Required: API key for OpenAI
      model: process.env.EMBEDDING_MODEL || "text-embedding-3-small", // Default embedding model
    },
  };
}
