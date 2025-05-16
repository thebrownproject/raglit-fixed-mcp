import { z } from "zod";
declare const chunkDocumentSchema: z.ZodObject<{
    content: z.ZodString;
    documentId: z.ZodString;
    chunkSize: z.ZodDefault<z.ZodNumber>;
    chunkOverlap: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    documentId: string;
    chunkSize: number;
    chunkOverlap: number;
    metadata?: Record<string, any> | undefined;
}, {
    content: string;
    documentId: string;
    metadata?: Record<string, any> | undefined;
    chunkSize?: number | undefined;
    chunkOverlap?: number | undefined;
}>;
/**
 * Defines the schema and handler for the 'chunk_document' tool.
 * This tool splits a given document into smaller, fixed-size chunks based on word count,
 * generates embeddings for each chunk, and stores them via the configured REST API.
 */
export declare const chunkDocumentTool: {
    /**
     * Zod schema for validating the input parameters of the tool.
     */
    schema: z.ZodObject<{
        content: z.ZodString;
        documentId: z.ZodString;
        chunkSize: z.ZodDefault<z.ZodNumber>;
        chunkOverlap: z.ZodDefault<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        documentId: string;
        chunkSize: number;
        chunkOverlap: number;
        metadata?: Record<string, any> | undefined;
    }, {
        content: string;
        documentId: string;
        metadata?: Record<string, any> | undefined;
        chunkSize?: number | undefined;
        chunkOverlap?: number | undefined;
    }>;
    /**
     * Handles the document chunking process.
     * @param params - The validated input parameters.
     * @returns A result object indicating success or failure, along with chunk information.
     */
    handler: ({ content, documentId, chunkSize, chunkOverlap, metadata, }: z.infer<typeof chunkDocumentSchema>) => Promise<{
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
