// src/tools/chunkDocument.ts
import { z } from "zod";
import { FixedChunker } from "../chunkers/fixedChunker.js";
import { RestApiChunkRepository } from "../repositories/RestApiChunkRepository.js";
import { getEmbedding } from "../services/embedding.js";
import { loadConfig } from "../config.js";
// Load application configuration (e.g., API keys, base URLs)
const config = loadConfig();
// Initialize the repository for storing and managing chunks.
// This uses a REST API backend, consistent with other tools.
const chunkRepository = new RestApiChunkRepository(config.api.baseUrl, config.api.apiKey);
const chunkDocumentSchema = z.object({
    content: z.string().min(1, "Document content is required"),
    documentId: z.string().min(1, "Document ID is required"),
    chunkSize: z
        .number()
        .int()
        .positive()
        .default(500)
        .describe("The target size of each chunk in words (tokenized by whitespace)."),
    chunkOverlap: z
        .number()
        .int()
        .nonnegative()
        .default(50)
        .describe("The number of words to overlap between consecutive chunks."),
    metadata: z
        .record(z.any())
        .optional()
        .describe("Optional metadata to associate with the chunks."),
});
/**
 * Defines the schema and handler for the 'chunk_document' tool.
 * This tool splits a given document into smaller, fixed-size chunks based on word count,
 * generates embeddings for each chunk, and stores them via the configured REST API.
 */
export const chunkDocumentTool = {
    /**
     * Zod schema for validating the input parameters of the tool.
     */
    schema: chunkDocumentSchema,
    /**
     * Handles the document chunking process.
     * @param params - The validated input parameters.
     * @returns A result object indicating success or failure, along with chunk information.
     */
    handler: async ({ content, documentId, chunkSize, chunkOverlap, metadata, }) => {
        try {
            // Instantiate the chunker with the specified size and overlap.
            const chunker = new FixedChunker({
                chunkSize,
                chunkOverlap,
            });
            // Perform the chunking operation on the document content.
            const chunks = chunker.chunk(content, metadata || {}); // Ensure metadata is an object if undefined
            const chunkIds = []; // Ensure type allows for undefined IDs
            // Process and store each generated chunk.
            for (const chunk of chunks) {
                // Generate an embedding vector for the chunk's content.
                const embedding = await getEmbedding(chunk.content);
                // Store the chunk details (content, embedding, metadata, etc.) in the repository.
                const chunkId = await chunkRepository.storeChunk({
                    content: chunk.content,
                    embedding,
                    documentId,
                    chunkIndex: chunk.index,
                    chunkSize,
                    chunkOverlap,
                    chunkStrategy: "fixed-size", // Strategy used for chunking
                    metadata: chunk.metadata,
                });
                chunkIds.push(chunkId); // Add chunkId (which might be undefined if API fails to return one)
            }
            // Return a success response with details about the processed chunks.
            return {
                content: [
                    {
                        type: "text", // Explicitly set type as literal "text"
                        text: JSON.stringify({
                            success: true,
                            documentId,
                            chunks: chunks.length,
                            chunkIds: chunkIds.filter((id) => id !== undefined), // Filter out undefined IDs for the response
                        }),
                    },
                ],
            };
        }
        catch (error) {
            // Catch any errors during the process
            console.error(`Error in chunk_document tool for document ${documentId}:`, error);
            // Return an error response.
            return {
                content: [
                    {
                        type: "text", // Explicitly set type as literal "text"
                        text: JSON.stringify({
                            success: false,
                            documentId,
                            error: error.message,
                        }),
                    },
                ],
                isError: true, // Indicate that an error occurred
            };
        }
    },
};
//# sourceMappingURL=chunkDocuments.js.map