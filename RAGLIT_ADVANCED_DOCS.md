# RagLit MCP Server Implementation

This implementation uses the Model Context Protocol (MCP) SDK to create a server that provides fixed-size document chunking and vector search capabilities using a generic REST API backend.

## Project Structure

```
raglit/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── server.ts                # MCP server implementation
│   ├── config.ts                # Configuration loading (API endpoints, keys)
│   ├── chunkers/
│   │   └── fixedChunker.ts      # Fixed-size chunking logic
│   ├── services/
│   │   └── embedding.ts         # Embedding service integration (e.g., OpenAI)
│   ├── repositories/
│   │   ├── ChunkRepository.ts   # Interface for chunk operations
│   │   └── RestApiChunkRepository.ts # Implementation for REST API backend
│   └── tools/
│       ├── chunkDocuments.ts    # Tool to chunk documents
│       ├── searchChunks.ts      # Tool to search for relevant chunks
│       └── filterMetadata.ts    # Tool to filter by metadata
├── .env                         # Environment variable configuration (create this file)
├── package.json
└── tsconfig.json
└── README.md
```

## Implementation Files

### package.json

```json
{
  "name": "raglit",
  "version": "1.0.0",
  "description": "RagLit: An MCP server for document chunking, embedding, and retrieval for RAG pipelines via a REST API.",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc -w",
    "lint": "eslint 'src/**/*.ts'",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["mcp", "rag", "chunking", "llm", "ai"],
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.11.3", // Or your current version
    "dotenv": "^16.5.0", // Or your current version
    "zod": "^3.24.4" // Or your current version
  },
  "devDependencies": {
    "@types/node": "^22.15.18", // Or your current version
    "@typescript-eslint/eslint-plugin": "^6.19.0", // Or your current version
    "@typescript-eslint/parser": "^6.19.0", // Or your current version
    "eslint": "^8.56.0", // Or your current version
    "typescript": "^5.8.3" // Or your current version
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### src/index.ts

```typescript
import { main } from "./server.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Start the server
main().catch((error) => {
  console.error("Failed to start RagLit server:", error);
  process.exit(1);
});
```

### src/server.ts

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { chunkDocumentTool } from "./tools/chunkDocuments.js";
import { searchChunksTool } from "./tools/searchChunks.js";
import { filterMetadataTool } from "./tools/filterMetadata.js";

/**
 * Create and initialize the MCP server
 */
export async function main() {
  // Create the MCP server
  const server = new McpServer(
    {
      name: "raglit",
      version: "1.0.0",
      description:
        "RagLit: An MCP server for document chunking, embedding, and retrieval for RAG pipelines via a REST API.",
    },
    {
      capabilities: {
        tools: {}, // Enable tools capability
      },
    }
  );

  console.log("Initializing RagLit MCP server...");

  // Register all tools
  server.tool(
    "chunk_document",
    chunkDocumentTool.schema.shape,
    chunkDocumentTool.handler
  );
  server.tool(
    "search_chunks",
    searchChunksTool.schema.shape,
    searchChunksTool.handler
  );
  server.tool(
    "filter_metadata",
    filterMetadataTool.schema.shape,
    filterMetadataTool.handler
  );

  // Create a transport
  const transport = new StdioServerTransport();

  // Connect to the transport to start handling requests
  await server.connect(transport);

  console.log("RagLit MCP server is running and ready to accept requests.");

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("Shutting down RagLit MCP server...");
    transport.close();
    process.exit(0);
  });
}
```

### src/config.ts

(Illustrative - refer to your actual `src/config.ts` for the full, correct content)

```typescript
// src/config.ts
import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  api: {
    baseUrl: string; // Base URL for your backend REST API
    apiKey?: string; // Optional API key for your backend
  };
  embedding: {
    apiKey: string; // OpenAI API Key
    model: string; // Embedding model name
  };
}

export function loadConfig(): AppConfig {
  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL environment variable is required.");
  }

  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (!openAiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required.");
  }

  return {
    api: {
      baseUrl: apiBaseUrl,
      apiKey: process.env.API_KEY,
    },
    embedding: {
      apiKey: openAiApiKey,
      model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    },
  };
}
```

### `src/repositories/RestApiChunkRepository.ts`

(Illustrative - this section should describe your actual repository that interacts with the generic REST API for storing and searching chunks. The Supabase-specific database code would no longer be directly in this project's `src/database` folder.)

This class implements `ChunkRepository` and uses `fetch` to interact with the backend API specified by `API_BASE_URL`. It would handle `POST` requests to endpoints like `/chunks`, `/chunks/search`, and `/chunks/filter` on that backend.

**Note:** The `src/database/supabase.ts` file and direct Supabase client usage within the MCP server's codebase have been removed. This server now relies on a generic REST API backend for persistence and vector search. The SQL and Supabase-specific setup instructions later in this document would apply to that _backend API service_, not directly to this MCP server.

### `src/services/embedding.ts`

(Illustrative - refer to your actual `src/services/embedding.ts` for the full, correct content)

```typescript
// src/services/embedding.ts
import { loadConfig } from "../config.js";

const DEFAULT_EMBEDDING_TIMEOUT = 10000;

export async function getEmbedding(text: string): Promise<number[]> {
  const config = loadConfig();
  const { apiKey: openAiApiKey, model: embeddingModel } = config.embedding;

  if (!openAiApiKey) {
    throw new Error(
      "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables."
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      DEFAULT_EMBEDDING_TIMEOUT
    );

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: embeddingModel,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetails = "Unknown error";
      try {
        const errorResponse = await response.json();
        errorDetails =
          errorResponse.error?.message || JSON.stringify(errorResponse);
      } catch (parseError) {
        errorDetails = await response.text();
      }
      throw new Error(`OpenAI API error (${response.status}): ${errorDetails}`);
    }

    const result = await response.json();
    if (result.data && result.data.length > 0 && result.data[0].embedding) {
      return result.data[0].embedding;
    } else {
      throw new Error("Invalid response structure from OpenAI API.");
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(
        `Embedding request timed out after ${DEFAULT_EMBEDDING_TIMEOUT}ms`
      );
    }
    throw error;
  }
}
```

### `src/chunkers/fixedChunker.ts`

(Illustrative - refer to your actual `src/chunkers/fixedChunker.ts` for the full, correct content)

```typescript
// src/chunkers/fixedChunker.ts
export interface ChunkerOptions {
  chunkSize: number;
  chunkOverlap: number;
}

export interface ChunkResult {
  content: string;
  index: number;
  metadata: Record<string, any>;
}

export class FixedChunker {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(options: ChunkerOptions) {
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;
    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error(
        "Chunk overlap must be less than chunk size to ensure progression."
      );
    }
    if (this.chunkSize <= 0) {
      throw new Error("Chunk size must be a positive number.");
    }
  }

  chunk(text: string, metadata: Record<string, any> = {}): ChunkResult[] {
    const tokens = text.split(/\s+/).filter((token) => token.length > 0);
    const chunks: ChunkResult[] = [];
    if (tokens.length === 0) return chunks;

    let currentChunkIndex = 0;
    let currentTokenStartIndex = 0;

    while (currentTokenStartIndex < tokens.length) {
      const currentTokenEndIndex = Math.min(
        currentTokenStartIndex + this.chunkSize,
        tokens.length
      );
      const chunkTokens = tokens.slice(
        currentTokenStartIndex,
        currentTokenEndIndex
      );
      const chunkContent = chunkTokens.join(" ");

      chunks.push({
        content: chunkContent,
        index: currentChunkIndex,
        metadata: {
          ...metadata,
          chunk_index: currentChunkIndex,
          word_count: chunkTokens.length,
        },
      });

      currentTokenStartIndex += this.chunkSize - this.chunkOverlap;
      currentChunkIndex++;
      if (this.chunkSize - this.chunkOverlap <= 0) break;
    }
    return chunks;
  }
}
```

### `src/tools/chunkDocuments.ts`

(Illustrative - refer to your actual `src/tools/chunkDocuments.ts` for the full, correct content. It now uses `RestApiChunkRepository`)

```typescript
// src/tools/chunkDocuments.ts
import { z } from "zod";
import { FixedChunker } from "../chunkers/fixedChunker.js";
import { RestApiChunkRepository } from "../repositories/RestApiChunkRepository.js";
import { getEmbedding } from "../services/embedding.js";
import { loadConfig } from "../config.js";

const config = loadConfig();
const chunkRepository = new RestApiChunkRepository(
  config.api.baseUrl,
  config.api.apiKey
);

const chunkDocumentSchema = z.object({
  content: z.string().min(1),
  documentId: z.string().min(1),
  chunkSize: z.number().int().positive().default(500),
  chunkOverlap: z.number().int().nonnegative().default(50),
  metadata: z.record(z.any()).optional(),
});

export const chunkDocumentTool = {
  schema: chunkDocumentSchema,
  handler: async (params: z.infer<typeof chunkDocumentSchema>) => {
    const { content, documentId, chunkSize, chunkOverlap, metadata } = params;
    const chunker = new FixedChunker({ chunkSize, chunkOverlap });
    const chunks = chunker.chunk(content, metadata || {});
    const chunkIds: (string | undefined)[] = [];

    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.content);
      const chunkId = await chunkRepository.storeChunk({
        content: chunk.content,
        embedding,
        documentId,
        chunkIndex: chunk.index,
        chunkSize,
        chunkOverlap,
        chunkStrategy: "fixed-size",
        metadata: chunk.metadata,
      });
      chunkIds.push(chunkId);
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            documentId,
            chunks: chunks.length,
            chunkIds: chunkIds.filter((id) => id !== undefined),
          }),
        },
      ],
    };
    // Error handling omitted for brevity in this illustrative example but present in actual file
  },
};
```

### `src/tools/searchChunks.ts`

(Illustrative - refer to your actual `src/tools/searchChunks.ts` for the full, correct content. It uses `RestApiChunkRepository`)

```typescript
// src/tools/searchChunks.ts
import { z } from "zod";
import { RestApiChunkRepository } from "../repositories/RestApiChunkRepository.js";
import { getEmbedding } from "../services/embedding.js";
import { loadConfig } from "../config.js";

const config = loadConfig();
const chunkRepository = new RestApiChunkRepository(
  config.api.baseUrl,
  config.api.apiKey
);

const searchChunksSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().default(5),
  metadataFilter: z.record(z.any()).optional(),
  threshold: z.number().min(0).max(1).default(0.7),
});

export const searchChunksTool = {
  schema: searchChunksSchema,
  handler: async (params: z.infer<typeof searchChunksSchema>) => {
    const { query, limit, metadataFilter, threshold } = params;
    const embedding = await getEmbedding(query);
    const results = await chunkRepository.searchSimilarChunks(
      embedding,
      limit,
      metadataFilter || {},
      threshold
    );
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, results }),
        },
      ],
    };
    // Error handling omitted for brevity
  },
};
```

### `src/tools/filterMetadata.ts`

(Illustrative - refer to your actual `src/tools/filterMetadata.ts` for the full, correct content. It uses `RestApiChunkRepository`)

```typescript
// src/tools/filterMetadata.ts
import { z } from "zod";
import { RestApiChunkRepository } from "../repositories/RestApiChunkRepository.js";
import { loadConfig } from "../config.js";

const config = loadConfig();
const chunkRepository = new RestApiChunkRepository(
  config.api.baseUrl,
  config.api.apiKey
);

const filterMetadataSchema = z.object({
  metadataFilter: z
    .record(z.string(), z.any())
    .refine((obj) => Object.keys(obj).length > 0),
  limit: z.number().int().positive().default(10),
});

export const filterMetadataTool = {
  schema: filterMetadataSchema,
  handler: async (params: z.infer<typeof filterMetadataSchema>) => {
    const { metadataFilter, limit } = params;
    const results = await chunkRepository.filterChunksByMetadata(
      metadataFilter,
      limit
    );
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, results }),
        },
      ],
    };
    // Error handling omitted for brevity
  },
};
```

## Backend API Setup (Example with SQL & pgvector)

This RagLit MCP server communicates with a backend REST API. If your backend uses a PostgreSQL database with the pgvector extension (like Supabase or a self-hosted instance), here is an example SQL setup you might use for that backend service. **Note: This SQL is for the backend API, not directly for this MCP server.**

1.  Enable the pgvector extension.
2.  Create a `chunks` table.
3.  Create a stored procedure for vector similarity search.

```sql
-- Enable the pgvector extension (on your backend database)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing document chunks (on your backend database)
CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- Ensure this matches your embedding model's dimensions (e.g., 1536 for OpenAI text-embedding-3-small)

  -- Metadata fields
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,     -- Consider if this is word count or character count based on your chunker
  chunk_overlap INTEGER NOT NULL,
  chunk_strategy TEXT NOT NULL DEFAULT 'fixed-size',

  -- Custom metadata as JSON
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for vector similarity search (on your backend database)
-- Choose an appropriate index type (e.g., IVFFlat, HNSW) based on your data size and performance needs.
-- For IVFFlat, the `lists` parameter should be tuned. Example:
CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- For HNSW (often better for many use cases):
-- CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);

-- Create a function for similarity search (on your backend database)
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1536), -- Match dimensions with your table
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  document_id TEXT,
  chunk_index INTEGER,
  metadata JSONB, -- Return relevant metadata
  similarity FLOAT -- Cosine similarity can be calculated as 1 - (embedding <=> query_embedding)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chunks.id,
    chunks.content,
    chunks.document_id,
    chunks.chunk_index,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) AS similarity
  FROM chunks
  WHERE 1 - (chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

## Usage Instructions for RagLit Server

1.  **Set up your Backend API**: Ensure your REST API (e.g., built with Express.js, FastAPI, or a BaaS like Supabase configured with the above SQL if applicable) is running and accessible. It needs to expose endpoints like `/chunks`, `/chunks/search`, and `/chunks/filter` that the `RestApiChunkRepository` will call.
2.  **Clone the RagLit Repository**: `git clone <your-raglit-repo-url>` and `cd raglit`.
3.  **Configure RagLit**: Create a `.env` file in the RagLit project root:

    ```env
    API_BASE_URL=http://your-backend-api-url/api # URL for YOUR backend REST API
    OPENAI_API_KEY=your-openai-key
    # API_KEY=your-backend-api-key # If your backend API needs a separate key
    # EMBEDDING_MODEL=text-embedding-3-small # Optional, defaults in code
    ```

4.  **Install RagLit Dependencies & Build**: `npm install && npm run build`
5.  **Start the RagLit Server**: `npm start`

    The RagLit MCP server is now ready to receive requests.

## Connecting to the RagLit MCP Server

You can connect to this MCP server using any MCP client. Here's an example using the MCP TypeScript SDK:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

// Path to your RagLit server's compiled entry point
const raglitServerPath = "path/to/your/raglit/dist/index.js";

// Start the RagLit MCP server process
const serverProcess = spawn("node", [raglitServerPath]);

// Create a transport connected to the server process
const transport = new StdioClientTransport({
  stdin: serverProcess.stdin,
  stdout: serverProcess.stdout,
  onClose: () => {
    console.log("RagLit Server connection closed");
  },
});

// Create an MCP client
const client = new Client({
  name: "my-raglit-client",
  version: "1.0.0",
});

// Connect to the RagLit server
await client.connect(transport);

// Now you can call the tools
async function testRagLit() {
  try {
    const chunkResult = await client.callTool("chunk_document", {
      content:
        "This is a test document about the wonders of modern AI and large language models.",
      documentId: "test-doc-001",
      chunkSize: 20, // Word count
      chunkOverlap: 5,
      metadata: { source: "test-suite", category: "example" },
    });
    console.log("Chunking result:", JSON.stringify(chunkResult, null, 2));

    const searchResult = await client.callTool("search_chunks", {
      query: "What are language models?",
      limit: 2,
      metadataFilter: { category: "example" },
    });
    console.log("Search result:", JSON.stringify(searchResult, null, 2));
  } catch (err) {
    console.error("Error calling RagLit tool:", err);
  } finally {
    // Clean up: close connection and terminate server process
    await client.disconnect();
    serverProcess.kill();
  }
}

testRagLit();
```

This RagLit server, in conjunction with a suitable backend API, provides a comprehensive solution for document chunking and semantic search, following the Model Context Protocol for standardized tool interactions.
