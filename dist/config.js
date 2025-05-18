// src/config.ts
import dotenv from "dotenv";
// Load environment variables from a .env file into process.env
dotenv.config();
/**
 * Loads and validates the application configuration from environment variables.
 * It checks for the presence of required variables and provides default values for optional ones.
 *
 * @returns An `AppConfig` object containing the loaded and validated configuration.
 * @throws Error if required environment variables (EXTERNAL_API_URL, OPENAI_API_KEY) are not set.
 */
export function loadConfig() {
    // Validate and retrieve EXTERNAL_API_URL
    const externalApiUrl = process.env.EXTERNAL_API_URL;
    if (!externalApiUrl) {
        throw new Error("EXTERNAL_API_URL environment variable is required. This is the base URL for your PostgREST service.");
    }
    // Validate and retrieve OPENAI_API_KEY
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
        throw new Error("OPENAI_API_KEY environment variable is required for generating embeddings.");
    }
    // Construct and return the configuration object
    return {
        postgrest: {
            baseUrl: externalApiUrl,
            apiKey: process.env.EXTERNAL_API_KEY, // Optional: API key for the PostgREST API
        },
        embedding: {
            apiKey: openAiApiKey, // Required: API key for OpenAI
            model: process.env.EMBEDDING_MODEL || "text-embedding-3-small", // Default embedding model
        },
    };
}
//# sourceMappingURL=config.js.map