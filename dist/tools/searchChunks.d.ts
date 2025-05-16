import { z } from "zod";
declare const searchChunksSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    metadataFilter: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    threshold: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    threshold: number;
    query: string;
    limit: number;
    metadataFilter?: Record<string, any> | undefined;
}, {
    query: string;
    threshold?: number | undefined;
    limit?: number | undefined;
    metadataFilter?: Record<string, any> | undefined;
}>;
/**
 * Defines the schema and handler for the 'search_chunks' tool.
 * This tool searches for document chunks that are semantically similar to a given query,
 * using vector embeddings and a similarity threshold, via a REST API.
 */
export declare const searchChunksTool: {
    /**
     * Zod schema for validating the input parameters of the tool.
     */
    schema: z.ZodObject<{
        query: z.ZodString;
        limit: z.ZodDefault<z.ZodNumber>;
        metadataFilter: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        threshold: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        threshold: number;
        query: string;
        limit: number;
        metadataFilter?: Record<string, any> | undefined;
    }, {
        query: string;
        threshold?: number | undefined;
        limit?: number | undefined;
        metadataFilter?: Record<string, any> | undefined;
    }>;
    /**
     * Handles the chunk searching process.
     * @param params - The validated input parameters according to searchChunksSchema.
     * @returns A result object containing the search results or an error message.
     */
    handler: ({ query, limit, metadataFilter, threshold, }: z.infer<typeof searchChunksSchema>) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
        isError?: undefined;
    } | {
        content: {
            type: "text";
            text: string;
        }[];
        isError: boolean;
    }>;
};
export {};
