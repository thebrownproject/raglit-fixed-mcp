import { z } from "zod";
import { RestApiChunkRepository } from "../repositories/RestApiChunkRepository.js";
import { getEmbedding } from "../services/embedding.js";
import { loadConfig } from "../config.js";
// Load application configuration
const config = loadConfig();
// Initialize the repository for chunk operations
const chunkRepository = new RestApiChunkRepository(config.api.baseUrl, config.api.apiKey);
// Define the Zod schema for the searchChunksTool inputs
const searchChunksSchema = z.object({
    query: z
        .string()
        .min(1, "Search query is required")
        .describe("The search query string."),
    limit: z
        .number()
        .int()
        .positive()
        .default(5)
        .describe("The maximum number of search results to return."),
    metadataFilter: z
        .record(z.any())
        .optional()
        .describe("Optional metadata filter to apply to the search."),
    threshold: z
        .number()
        .min(0)
        .max(1)
        .default(0.7)
        .describe("The similarity threshold for matching chunks (0 to 1)."),
});
/**
 * Defines the schema and handler for the 'search_chunks' tool.
 * This tool searches for document chunks that are semantically similar to a given query,
 * using vector embeddings and a similarity threshold, via a REST API.
 */
export const searchChunksTool = {
    /**
     * Zod schema for validating the input parameters of the tool.
     */
    schema: searchChunksSchema,
    /**
     * Handles the chunk searching process.
     * @param params - The validated input parameters according to searchChunksSchema.
     * @returns A result object containing the search results or an error message.
     */
    handler: async ({ query, limit, metadataFilter, threshold, }) => {
        try {
            // Generate an embedding for the search query.
            const embedding = await getEmbedding(query);
            // Perform the search for similar chunks using the repository.
            const results = await chunkRepository.searchSimilarChunks(embedding, limit, metadataFilter || {}, // Ensure metadataFilter is an object if undefined
            threshold);
            // Return a success response with the search results.
            return {
                content: [
                    {
                        type: "text", // Explicitly set type as literal "text"
                        text: JSON.stringify({
                            success: true,
                            results,
                        }),
                    },
                ],
            };
        }
        catch (error) {
            // Catch any errors during the process
            console.error("Error searching chunks:", error);
            // Return an error response.
            return {
                content: [
                    {
                        type: "text", // Explicitly set type as literal "text"
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                        }),
                    },
                ],
                isError: true, // Indicate that an error occurred
            };
        }
    },
};
//# sourceMappingURL=searchChunks.js.map