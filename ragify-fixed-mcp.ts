# Ragify Fixed MCP Server Implementation

This implementation uses the Model Context Protocol (MCP) SDK to create a server that provides fixed-size document chunking and vector search capabilities using Supabase with pgvector.

## Project Structure

```
ragify-fixed-mcp/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── server.ts                # MCP server implementation
│   ├── chunkers/
│   │   └── fixedChunker.ts      # Fixed-size chunking logic
│   ├── database/
│   │   └── supabase.ts          # Supabase client and DB operations
│   ├── services/
│   │   └── embedding.ts         # Embedding service integration
│   └── tools/
│       ├── chunkDocument.ts     # Tool to chunk documents
│       ├── searchChunks.ts      # Tool to search for relevant chunks
│       └── filterMetadata.ts    # Tool to filter by metadata
├── package.json
└── tsconfig.json
```

## Implementation Files

### package.json

```json
{
  "name": "ragify-fixed-mcp",
  "version": "1.0.0",
  "description": "MCP server for fixed-size document chunking with Supabase pgvector",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc -w",
    "lint": "eslint 'src/**/*.ts'",
    "test": "jest"
  },
  "keywords": [
    "mcp",
    "supabase",
    "pgvector",
    "rag",
    "chunking"
  ],
  "dependencies": {
    "@modelcontextprotocol/sdk": "^3.9.0",
    "@supabase/supabase-js": "^2.39.3",
    "dotenv": "^16.3.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "typescript": "^5.3.3"
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
import { main } from './server.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Start the server
main().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

### src/server.ts

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { chunkDocumentTool } from './tools/chunkDocument.js';
import { searchChunksTool } from './tools/searchChunks.js';
import { filterMetadataTool } from './tools/filterMetadata.js';

/**
 * Create and initialize the MCP server
 */
export async function main() {
  // Create the MCP server
  const server = new McpServer({
    name: 'ragify-fixed-mcp',
    version: '1.0.0',
    description: 'MCP server for fixed-size document chunking with Supabase pgvector'
  }, {
    capabilities: {
      tools: {} // Enable tools capability
    }
  });

  console.log('Initializing Ragify Fixed MCP server...');

  // Register all tools
  server.tool("chunk_document", chunkDocumentTool.schema, chunkDocumentTool.handler);
  server.tool("search_chunks", searchChunksTool.schema, searchChunksTool.handler);
  server.tool("filter_metadata", filterMetadataTool.schema, filterMetadataTool.handler);

  // Create a transport
  const transport = new StdioServerTransport();
  
  // Connect to the transport to start handling requests
  await server.connect(transport);
  
  console.log('Ragify Fixed MCP server is running');
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down Ragify Fixed MCP server...');
    transport.close();
    process.exit(0);
  });
}
```

### src/database/supabase.ts

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Parameters for storing a chunk in the database
 */
export interface StoreChunkParams {
  content: string;
  embedding: number[];
  documentId: string;
  chunkIndex: number;
  chunkSize: number;
  chunkOverlap: number;
  chunkStrategy: string;
  metadata?: Record<string, any>;
}

/**
 * Store a document chunk in the database
 */
export async function storeChunk({
  content,
  embedding,
  documentId,
  chunkIndex,
  chunkSize,
  chunkOverlap,
  chunkStrategy,
  metadata = {}
}: StoreChunkParams): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('chunks')
    .insert({
      content,
      embedding,
      document_id: documentId,
      chunk_index: chunkIndex,
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
      chunk_strategy: chunkStrategy,
      metadata
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to store chunk: ${error.message}`);
  }

  return data?.id;
}

/**
 * Search for similar chunks based on vector embedding
 */
export async function searchSimilarChunks(
  embedding: number[],
  limit = 5,
  metadataFilter: Record<string, any> = {},
  threshold = 0.7
) {
  // Build the query
  let query = supabase
    .rpc('match_chunks', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit
    });

  // Apply metadata filters if provided
  if (Object.keys(metadataFilter).length > 0) {
    // Handle metadata filtering through a containment JSON query
    query = query.filter('metadata', 'cs', metadataFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to search chunks: ${error.message}`);
  }

  return data;
}

/**
 * Filter chunks by metadata
 */
export async function filterChunksByMetadata(
  metadataFilter: Record<string, any>,
  limit = 10
) {
  const { data, error } = await supabase
    .from('chunks')
    .select('*')
    .filter('metadata', 'cs', metadataFilter)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to filter chunks: ${error.message}`);
  }

  return data;
}
```

### src/services/embedding.ts

```typescript
/**
 * Service to generate embeddings for text using an external embedding API
 */

// Maximum timeout for embedding API requests in milliseconds
const EMBEDDING_TIMEOUT = 10000;

// OpenAI model for embeddings
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Get an embedding for a text string
 * 
 * This implementation uses OpenAI's embedding API, but you can
 * replace it with any embedding service you prefer
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY must be set in environment variables');
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT);
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: EMBEDDING_MODEL
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    return result.data[0].embedding;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Embedding request timed out');
    }
    throw error;
  }
}
```

### src/chunkers/fixedChunker.ts

```typescript
/**
 * Fixed-size text chunker
 */

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

  /**
   * Create a new fixed-size chunker
   */
  constructor(options: ChunkerOptions) {
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;
    
    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('Chunk overlap must be less than chunk size');
    }
  }

  /**
   * Split text into fixed-size chunks with overlap
   * 
   * NOTE: This is a simple token-based chunking approach.
   * In a production implementation, you might want to use
   * a more sophisticated approach that respects sentence
   * or paragraph boundaries.
   */
  chunk(text: string, metadata: Record<string, any> = {}): ChunkResult[] {
    // Simple tokenization by splitting on whitespace
    // In production, use a proper tokenizer
    const tokens = text.split(/\s+/);
    const chunks: ChunkResult[] = [];
    
    if (tokens.length === 0) {
      return chunks;
    }
    
    let index = 0;
    let tokenIndex = 0;
    
    // Create chunks with specified size and overlap
    while (tokenIndex < tokens.length) {
      const chunkTokens = tokens.slice(
        tokenIndex, 
        Math.min(tokenIndex + this.chunkSize, tokens.length)
      );
      
      const chunkContent = chunkTokens.join(' ');
      
      // Add the chunk
      chunks.push({
        content: chunkContent,
        index,
        metadata: {
          ...metadata,
          chunk_index: index,
          token_count: chunkTokens.length
        }
      });
      
      // Move to next chunk position, accounting for overlap
      tokenIndex += this.chunkSize - this.chunkOverlap;
      index++;
      
      // If we can't move forward (overlap >= remaining tokens), break
      if (tokenIndex >= tokens.length || this.chunkSize - this.chunkOverlap <= 0) {
        break;
      }
    }
    
    return chunks;
  }
}
```

### src/tools/chunkDocument.ts

```typescript
import { z } from 'zod';
import { FixedChunker } from '../chunkers/fixedChunker.js';
import { storeChunk } from '../database/supabase.js';
import { getEmbedding } from '../services/embedding.js';

/**
 * Tool for chunking a document using fixed-size strategy
 */
export const chunkDocumentTool = {
  schema: {
    content: z.string().min(1, "Document content is required"),
    documentId: z.string().min(1, "Document ID is required"),
    chunkSize: z.number().int().positive().default(500),
    chunkOverlap: z.number().int().nonnegative().default(50),
    metadata: z.record(z.any()).optional()
  },
  
  handler: async ({ content, documentId, chunkSize = 500, chunkOverlap = 50, metadata = {} }) => {
    try {
      // Create chunker instance
      const chunker = new FixedChunker({ 
        chunkSize, 
        chunkOverlap 
      });
      
      // Chunk the document
      const chunks = chunker.chunk(content, metadata);
      
      // Store each chunk in the database
      const chunkIds = [];
      for (const chunk of chunks) {
        // Get embedding for the chunk
        const embedding = await getEmbedding(chunk.content);
        
        // Store the chunk
        const chunkId = await storeChunk({
          content: chunk.content,
          embedding,
          documentId,
          chunkIndex: chunk.index,
          chunkSize,
          chunkOverlap,
          chunkStrategy: 'fixed-size',
          metadata: chunk.metadata
        });
        
        chunkIds.push(chunkId);
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            chunks: chunks.length,
            chunkIds
          })
        }]
      };
    } catch (error) {
      console.error('Error chunking document:', error);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message
          })
        }]
      };
    }
  }
};
```

### src/tools/searchChunks.ts

```typescript
import { z } from 'zod';
import { searchSimilarChunks } from '../database/supabase.js';
import { getEmbedding } from '../services/embedding.js';

/**
 * Tool for searching chunks by semantic similarity
 */
export const searchChunksTool = {
  schema: {
    query: z.string().min(1, "Search query is required"),
    limit: z.number().int().positive().default(5),
    metadataFilter: z.record(z.any()).optional(),
    threshold: z.number().min(0).max(1).default(0.7)
  },
  
  handler: async ({ query, limit = 5, metadataFilter = {}, threshold = 0.7 }) => {
    try {
      // Get embedding for the query
      const embedding = await getEmbedding(query);
      
      // Search for similar chunks
      const results = await searchSimilarChunks(
        embedding,
        limit,
        metadataFilter,
        threshold
      );
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            results
          })
        }]
      };
    } catch (error) {
      console.error('Error searching chunks:', error);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message
          })
        }]
      };
    }
  }
};
```

### src/tools/filterMetadata.ts

```typescript
import { z } from 'zod';
import { filterChunksByMetadata } from '../database/supabase.js';

/**
 * Tool for filtering chunks by metadata
 */
export const filterMetadataTool = {
  schema: {
    metadataFilter: z.record(z.any()).min(1, "At least one metadata filter is required"),
    limit: z.number().int().positive().default(10)
  },
  
  handler: async ({ metadataFilter, limit = 10 }) => {
    try {
      // Filter chunks by metadata
      const results = await filterChunksByMetadata(metadataFilter, limit);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            results
          })
        }]
      };
    } catch (error) {
      console.error('Error filtering chunks by metadata:', error);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message
          })
        }]
      };
    }
  }
};
```

## SQL for Supabase Setup

You'll need to set up the following in your Supabase project:

1. Enable the pgvector extension
2. Create the chunks table
3. Create a stored procedure for vector similarity search

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing document chunks
CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- Assuming OpenAI's 1536 dimensions
  
  -- Metadata fields
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  chunk_overlap INTEGER NOT NULL,
  chunk_strategy TEXT NOT NULL DEFAULT 'fixed-size',
  
  -- Custom metadata as JSON
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for vector similarity search
CREATE INDEX chunks_embedding_idx ON chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create a function for similarity search
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  document_id TEXT,
  chunk_index INTEGER,
  similarity FLOAT,
  metadata JSONB
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
    1 - (chunks.embedding <=> query_embedding) as similarity,
    chunks.metadata
  FROM chunks
  WHERE 1 - (chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

## Usage Instructions

1. First, create the SQL tables and functions in your Supabase project
2. Clone the repository and navigate to the project directory
3. Create a `.env` file with your Supabase and OpenAI credentials:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
OPENAI_API_KEY=your-openai-key
```

4. Install dependencies and build the project:

```bash
npm install
npm run build
```

5. Start the server:

```bash
npm start
```

6. The server is now ready to receive MCP requests through standard input/output.

## Connecting to the MCP Server

You can connect to this MCP server using any MCP client implementation. Here's a simple example using the MCP TypeScript SDK:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

// Start the Ragify MCP server process
const serverProcess = spawn('node', ['path/to/ragify-fixed-mcp/dist/index.js']);

// Create a transport connected to the server process
const transport = new StdioClientTransport({
  stdin: serverProcess.stdin,
  stdout: serverProcess.stdout,
  onClose: () => {
    console.log('Server connection closed');
  }
});

// Create an MCP client
const client = new Client({
  name: 'ragify-client',
  version: '1.0.0'
});

// Connect to the server
await client.connect(transport);

// Now you can call the tools
const chunkResult = await client.callTool('chunk_document', {
  content: 'Your document content here...',
  documentId: 'doc-123',
  chunkSize: 500,
  chunkOverlap: 50,
  metadata: { source: 'example', category: 'documentation' }
});

console.log('Chunking result:', chunkResult);

// Search for similar chunks
const searchResult = await client.callTool('search_chunks', {
  query: 'What is RAG?',
  limit: 5,
  metadataFilter: { category: 'documentation' }
});

console.log('Search result:', searchResult);
```

This server implementation provides a comprehensive solution for document chunking and semantic search using Supabase with pgvector, following the Model Context Protocol for standardized tool interactions.
