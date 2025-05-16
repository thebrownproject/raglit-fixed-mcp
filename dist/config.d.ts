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
export declare function loadConfig(): AppConfig;
