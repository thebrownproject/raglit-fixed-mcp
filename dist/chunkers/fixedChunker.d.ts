/**
 * Interface defining the options for configuring a chunker.
 */
export interface ChunkerOptions {
    chunkSize: number;
    chunkOverlap: number;
}
/**
 * Interface defining the structure of a single chunk produced by the chunker.
 */
export interface ChunkResult {
    content: string;
    index: number;
    metadata: Record<string, any>;
}
/**
 * Implements a fixed-size chunking strategy based on word/token count.
 * It splits text into chunks of a specified number of words, with a defined overlap between them.
 *
 * NOTE: This implementation uses a simple whitespace-based split for words/tokens.
 * For production scenarios, a more sophisticated tokenizer that aligns with the
 * embedding model's tokenization (e.g., SentencePiece, WordPiece) is recommended.
 */
export declare class FixedChunker {
    private chunkSize;
    private chunkOverlap;
    /**
     * Creates an instance of FixedChunker.
     * @param options - Configuration options for the chunker, including chunkSize and chunkOverlap.
     * @throws Error if chunkOverlap is not less than chunkSize.
     */
    constructor(options: ChunkerOptions);
    /**
     * Splits the input text into fixed-size chunks based on word count.
     *
     * @param text - The input string to be chunked.
     * @param metadata - Optional metadata to be merged into each chunk's metadata.
     * @returns An array of ChunkResult objects.
     */
    chunk(text: string, metadata?: Record<string, any>): ChunkResult[];
}
