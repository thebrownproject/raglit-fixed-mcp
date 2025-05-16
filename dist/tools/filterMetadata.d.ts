import { z } from "zod";
declare const filterMetadataSchema: z.ZodObject<{
    metadataFilter: z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    metadataFilter: Record<string, any>;
}, {
    metadataFilter: Record<string, any>;
    limit?: number | undefined;
}>;
/**
 * Defines the schema and handler for the 'filter_metadata' tool.
 * This tool filters stored chunks based on exact matches of provided metadata key-value pairs,
 * via a REST API.
 */
export declare const filterMetadataTool: {
    /**
     * Zod schema for validating the input parameters of the tool.
     */
    schema: z.ZodObject<{
        metadataFilter: z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodAny>, Record<string, any>, Record<string, any>>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        metadataFilter: Record<string, any>;
    }, {
        metadataFilter: Record<string, any>;
        limit?: number | undefined;
    }>;
    /**
     * Handles the metadata filtering process.
     * @param params - The validated input parameters according to filterMetadataSchema.
     * @returns A result object containing the filtered chunks or an error message.
     */
    handler: ({ metadataFilter, limit, }: z.infer<typeof filterMetadataSchema>) => Promise<{
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
