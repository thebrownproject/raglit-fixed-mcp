import { z } from "zod";
import { RestApiChunkRepository } from "../repositories/RestApiChunkRepository.js";
import { loadConfig } from "../config.js";

// Load application configuration
const config = loadConfig();

// Initialize the repository for chunk operations
const chunkRepository = new RestApiChunkRepository(
  config.api.baseUrl,
  config.api.apiKey
);

// Define the Zod schema for the filterMetadataTool inputs
const filterMetadataSchema = z.object({
  metadataFilter: z
    .record(z.string(), z.any())
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "At least one metadata filter key-value pair is required",
    })
    .describe("An object containing metadata key-value pairs to filter by."),
  limit: z
    .number()
    .int()
    .positive()
    .default(10)
    .describe("The maximum number of filtered chunks to return."),
});

/**
 * Defines the schema and handler for the 'filter_metadata' tool.
 * This tool filters stored chunks based on exact matches of provided metadata key-value pairs,
 * via a REST API.
 */
export const filterMetadataTool = {
  /**
   * Zod schema for validating the input parameters of the tool.
   */
  schema: filterMetadataSchema,

  /**
   * Handles the metadata filtering process.
   * @param params - The validated input parameters according to filterMetadataSchema.
   * @returns A result object containing the filtered chunks or an error message.
   */
  handler: async ({
    metadataFilter,
    limit,
  }: z.infer<typeof filterMetadataSchema>) => {
    try {
      // Filter chunks by metadata using the repository.
      const results = await chunkRepository.filterChunksByMetadata(
        metadataFilter,
        limit
      );

      // Return a success response with the filtered results.
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              results,
            }),
          },
        ],
      };
    } catch (error: any) {
      console.error("Error filtering chunks by metadata:", error);

      // Return an error response.
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
        isError: true,
      };
    }
  },
};
