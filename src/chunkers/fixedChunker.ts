/**
 * Interface defining the options for configuring a chunker.
 */
export interface ChunkerOptions {
  chunkSize: number; // The target number of words/tokens per chunk.
  chunkOverlap: number; // The number of words/tokens to overlap between consecutive chunks.
}

/**
 * Interface defining the structure of a single chunk produced by the chunker.
 */
export interface ChunkResult {
  content: string; // The textual content of the chunk.
  index: number; // The sequential index of the chunk (0-based).
  metadata: Record<string, any>; // Metadata associated with the chunk.
}

/**
 * Implements a fixed-size chunking strategy based on word/token count.
 * It splits text into chunks of a specified number of words, with a defined overlap between them.
 *
 * NOTE: This implementation uses a simple whitespace-based split for words/tokens.
 * For production scenarios, a more sophisticated tokenizer that aligns with the
 * embedding model's tokenization (e.g., SentencePiece, WordPiece) is recommended.
 */
export class FixedChunker {
  private chunkSize: number;
  private chunkOverlap: number;

  /**
   * Creates an instance of FixedChunker.
   * @param options - Configuration options for the chunker, including chunkSize and chunkOverlap.
   * @throws Error if chunkOverlap is not less than chunkSize.
   */
  constructor(options: ChunkerOptions) {
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;

    // Validate that overlap is less than chunk size to ensure forward progress during chunking.
    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error(
        "Chunk overlap must be less than chunk size to ensure progression."
      );
    }
    if (this.chunkSize <= 0) {
      throw new Error("Chunk size must be a positive number.");
    }
  }

  /**
   * Splits the input text into fixed-size chunks based on word count.
   *
   * @param text - The input string to be chunked.
   * @param metadata - Optional metadata to be merged into each chunk's metadata.
   * @returns An array of ChunkResult objects.
   */
  chunk(text: string, metadata: Record<string, any> = {}): ChunkResult[] {
    // Simple tokenization by splitting on whitespace. This treats each sequence of non-whitespace characters as a token.
    // For more advanced use cases, consider a proper tokenizer library.
    const tokens = text.split(/\s+/).filter((token) => token.length > 0); // Filter out empty strings from multiple spaces
    const chunks: ChunkResult[] = [];

    // If there are no tokens (e.g., empty or whitespace-only string), return no chunks.
    if (tokens.length === 0) {
      return chunks;
    }

    let currentChunkIndex = 0; // The 0-based index for the chunks array.
    let currentTokenStartIndex = 0; // The starting index in the `tokens` array for the current chunk.

    // Iterate through the tokens to create chunks.
    while (currentTokenStartIndex < tokens.length) {
      // Determine the end index for the current chunk's tokens.
      const currentTokenEndIndex = Math.min(
        currentTokenStartIndex + this.chunkSize,
        tokens.length
      );

      // Slice the tokens array to get the tokens for the current chunk.
      const chunkTokens = tokens.slice(
        currentTokenStartIndex,
        currentTokenEndIndex
      );
      const chunkContent = chunkTokens.join(" "); // Reconstruct the chunk content by joining tokens with spaces.

      // Add the newly created chunk to the list.
      chunks.push({
        content: chunkContent,
        index: currentChunkIndex,
        metadata: {
          ...metadata, // Include any base metadata provided.
          chunk_index: currentChunkIndex, // Add the specific index of this chunk.
          word_count: chunkTokens.length, // Add the number of words/tokens in this chunk.
        },
      });

      // Advance the starting token index for the next chunk.
      // The advance is by chunkSize less the overlap, to create the overlapping effect.
      currentTokenStartIndex += this.chunkSize - this.chunkOverlap;
      currentChunkIndex++;

      // If chunkSize equals chunkOverlap (which constructor should prevent, but as safeguard),
      // or if no progress can be made, break to prevent infinite loops.
      if (this.chunkSize - this.chunkOverlap <= 0) {
        break;
      }
    }
    return chunks;
  }
}
