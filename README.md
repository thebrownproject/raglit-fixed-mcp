# RagLit MCP Server for PostgREST

**RagLit** is a Model Context Protocol (MCP) server designed to facilitate document processing and retrieval for Retrieval Augmented Generation (RAG) pipelines. It acts as an interface to a **PostgREST-compatible backend API** (such as one provided by Supabase or a self-hosted PostgREST instance) that handles the persistent storage of document chunks, vector search, and metadata filtering using PostgreSQL and the `pgvector` extension.

## Features

- **MCP Compliant**: Implements the Model Context Protocol for standardized communication.
- **PostgREST Integration**: Specifically designed to work with PostgREST endpoints for database interaction.
- **Document Ingestion**: Chunks documents, generates OpenAI embeddings, and sends them to a PostgREST backend for storage in a PostgreSQL database.
- **Semantic Search**: Searches for relevant document chunks based on semantic similarity using `pgvector` capabilities, exposed via a PostgREST RPC function.
- **Metadata Filtering**: Filters stored chunks based on exact metadata matches via a PostgREST RPC function.
- **Configurable**: Uses environment variables for easy configuration of the PostgREST service URL, API key, and embedding models.

## Project Structure

```
src/
├── index.ts                        # Main entry point for the server
├── server.ts                       # MCP server implementation and tool registration
├── config.ts                       # Configuration loading and validation
├── chunkers/
│   └── fixedChunker.ts             # Fixed-size (word count) chunking logic
├── services/
│   └── embedding.ts                # OpenAI embedding service integration
├── repositories/
│   ├── ChunkRepository.ts          # Interface for chunk storage and retrieval
│   └── RestApiChunkRepository.ts   # Implementation using a REST API backend
└── tools/
    ├── chunkDocuments.ts           # MCP tool to chunk and store documents
    ├── searchChunks.ts             # MCP tool to search for relevant chunks
    └── filterMetadata.ts           # MCP tool to filter chunks by metadata

.env                                # Environment variable configuration (create this file)
package.json
tsconfig.json
README.md
```

## Prerequisites

- Node.js (v18 or later recommended)
- npm (usually comes with Node.js)
- Access to an OpenAI API key for generating embeddings.
- A running PostgREST service connected to a PostgreSQL database. This database must:
  1.  Have the **`pgvector` extension enabled**.
  2.  Contain a specific table (default: `chunks`) and SQL functions (`match_chunks`, `filter_chunks_by_meta`) for RagLit's operations.

## Backend Setup (PostgreSQL with PostgREST)

To use RagLit, your PostgreSQL database (exposed via PostgREST) needs the following setup:

1.  **Enable `pgvector` Extension** (run once per database):

    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;
    ```

2.  **Create the `chunks` Table**:

    ```sql
    CREATE TABLE public.chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id TEXT NOT NULL,
        text TEXT NOT NULL,
        metadata JSONB,
        embedding VECTOR(1536) -- Adjust 1536 to your embedding model's dimension (e.g., OpenAI text-embedding-ada-002 is 1536, text-embedding-3-small is 1536)
    );
    ```

    _(Note: If your PostgREST service uses a different schema than `public` for its exposed tables, adjust the table name accordingly in the function definitions below, e.g., `myschema.chunks`)_

3.  **Create SQL Functions for Search and Filter**:

    - **`match_chunks` (for semantic search)**:

      ```sql
      CREATE OR REPLACE FUNCTION match_chunks (
          query_embedding VECTOR(1536), -- Must match the dimension in your chunks table
          match_threshold FLOAT,
          match_count INT,
          p_document_id TEXT DEFAULT NULL
      )
      RETURNS TABLE (
          id UUID,
          document_id TEXT,
          text TEXT,
          metadata JSONB,
          embedding VECTOR(1536), -- Must match the dimension
          similarity FLOAT
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
          RETURN QUERY
          SELECT
              chunks.id,
              chunks.document_id,
              chunks.text,
              chunks.metadata,
              chunks.embedding,
              1 - (chunks.embedding <=> query_embedding) AS similarity -- Cosine distance -> similarity
          FROM public.chunks
          WHERE (p_document_id IS NULL OR chunks.document_id = p_document_id)
            AND (1 - (chunks.embedding <=> query_embedding)) >= match_threshold
          ORDER BY chunks.embedding <=> query_embedding
          LIMIT match_count;
      END;
      $$;
      ```

    - **`filter_chunks_by_meta` (for metadata filtering)**:
      ```sql
      CREATE OR REPLACE FUNCTION filter_chunks_by_meta (
          p_filter_metadata JSONB,
          p_limit INT,
          p_document_id TEXT DEFAULT NULL
      )
      RETURNS SETOF public.chunks -- Returns rows matching the chunks table structure
      LANGUAGE sql
      AS $$
      SELECT *
      FROM public.chunks
      WHERE (p_document_id IS NULL OR chunks.document_id = p_document_id)
        AND metadata @> p_filter_metadata -- '@>' JSONB operator: checks if left JSON contains right JSON
      LIMIT p_limit;
      $$;
      ```

    The `RestApiChunkRepository.ts` in this project is configured to call these specific table endpoints (`/rest/v1/chunks`) and RPC functions (`/rest/v1/rpc/match_chunks`, `/rest/v1/rpc/filter_chunks_by_meta`) with the specified parameter names.

## Setup (RagLit Server)

1.  **Clone the repository (if you haven't already):**

    ```bash
    git clone <repository-url>
    cd raglit
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create and configure the environment file:**
    Create a `.env` file in the root of the project and add the following environment variables:

    ```env
    # Required: Base URL for your PostgREST service
    # Example for Supabase: https://<your-project-ref>.supabase.co
    # Example for self-hosted PostgREST: http://localhost:3000
    EXTERNAL_API_URL=https://your-postgrest-service-url

    # Required: Your OpenAI API Key
    OPENAI_API_KEY=sk-yourOpenAiApiKey

    # Optional: API Key for your PostgREST service (e.g., Supabase anon key or service_role key)
    # This key will be sent as an 'apikey' header.
    EXTERNAL_API_KEY=yourPostgrestApiKey

    # Optional: OpenAI Embedding Model to use
    # Defaults to 'text-embedding-3-small' if not set
    # EMBEDDING_MODEL=text-embedding-3-small
    ```

    Replace the placeholder values with your actual PostgREST service URL and keys.

## Building the Server

To transpile the TypeScript code to JavaScript:

```bash
npm run build
```

This will create a `dist` directory with the compiled JavaScript files.

### Making the script executable (Optional)

For some environments or if you plan to execute the script directly, you might want to give the main built script execute permissions:

```bash
chmod +x dist/index.js
```

## Running the Server

After building, you can start the MCP server:

```bash
npm run start
```

The server will initialize and listen for MCP requests via standard input/output (stdio).

You should see output similar to:

```
Initializing RagLit MCP server...
RagLit MCP server is running and ready to accept requests.
```

## Integrating with Claude Desktop

To use this MCP server with Claude Desktop, you need to add its configuration to the `claude_desktop_config.json` file.

1.  **Locate `claude_desktop_config.json`:**

    - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
    - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json` (e.g., `C:\Users\<YourUsername>\AppData\Roaming\Claude\claude_desktop_config.json`)
    - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2.  **Edit the configuration file:**
    Open `claude_desktop_config.json` in a text editor. Add the following entry within the `mcpServers` object. If `mcpServers` doesn't exist, create it. **Remember to replace `/<filepath>/` with the absolute path to your `raglit-fixed-mcp` project directory.**

    ```json
    {
      "mcpServers": {
        // ... other existing MCP server configurations ...

        "raglit-postgrest": {
          // Renamed for clarity
          "command": "node",
          "args": [
            "/<filepath>/raglit-fixed-mcp/dist/index.js" // <-- IMPORTANT: Replace /<filepath>/ with the actual absolute path
          ],
          "env": {
            "EXTERNAL_API_URL": "https://your-postgrest-project-ref.supabase.co", // Or your specific PostgREST endpoint
            "OPENAI_API_KEY": "your_actual_openai_api_key_here", // <-- IMPORTANT: Use your actual OpenAI API key
            "EXTERNAL_API_KEY": "your_supabase_anon_or_service_role_key" // <-- IMPORTANT: Your PostgREST API key
          }
        }
      }
    }
    ```

    **Example for macOS if your project is in `~/Documents/Programming/portfolio/raglit/raglit-fixed-mcp` and using Supabase:**

    ```json
    // ...
        "raglit-postgrest": {
          "command": "node",
          "args": [
            "/Users/yourusername/Documents/Programming/portfolio/raglit/raglit-fixed-mcp/dist/index.js"
          ],
          "env": {
            "EXTERNAL_API_URL": "https://yourprojectref.supabase.co",
            "OPENAI_API_KEY": "sk-yourActualOpenAIKey...",
            "EXTERNAL_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi..." // Example Supabase anon key
          }
        }
    // ...
    ```

3.  **Save the file and restart Claude Desktop.**
    Your "raglit-postgrest" MCP server should now be available in Claude Desktop.

### Environment Variables for Claude Desktop Configuration:

- `EXTERNAL_API_URL` (required): This is the base URL of your PostgREST service (e.g., `https://your-project-ref.supabase.co`).
- `OPENAI_API_KEY` (required): Your secret API key provided by OpenAI for generating text embeddings.
- `EXTERNAL_API_KEY` (optional but common): Your PostgREST API key (e.g., Supabase `anon` or `service_role` key). This key is used for authorizing requests to your PostgREST backend.

The `env` block in `claude_desktop_config.json` will provide these environment variables to the `raglit` process when launched by Claude Desktop. These values will take precedence over those defined in a `.env` file within the `raglit-fixed-mcp` project directory for the instance run by Claude.

## MCP Tools Provided

RagLit exposes the following tools that can be called by an MCP client:

1.  **`chunk_document`**

    - **Description**: Splits a document into chunks, generates embeddings for each chunk, and stores them via the backend API.
    - **Input Parameters** (defined in `src/tools/chunkDocuments.ts`):
      - `content: string` (Document content to be chunked)
      - `documentId: string` (A unique identifier for the document)
      - `chunkSize?: number` (Target size of each chunk in words, defaults to 500)
      - `chunkOverlap?: number` (Number of words to overlap between chunks, defaults to 50)
      - `metadata?: Record<string, any>` (Optional metadata to associate with all chunks from this document)
    - **Output**: JSON string indicating success/failure, number of chunks, and their IDs.

2.  **`search_chunks`**

    - **Description**: Searches for stored document chunks that are semantically similar to a given query.
    - **Input Parameters** (defined in `src/tools/searchChunks.ts`):
      - `query: string` (The natural language search query)
      - `limit?: number` (Maximum number of results to return, defaults to 5)
      - `metadataFilter?: Record<string, any>` (Optional metadata to filter results by)
      - `threshold?: number` (Similarity threshold for matching, defaults to 0.7)
    - **Output**: JSON string with an array of matching chunk objects.

3.  **`filter_metadata`**
    - **Description**: Filters stored chunks based on exact matches of provided metadata key-value pairs.
    - **Input Parameters** (defined in `src/tools/filterMetadata.ts`):
      - `metadataFilter: Record<string, any>` (Metadata object to filter by; at least one key-value pair required)
      - `limit?: number` (Maximum number of results to return, defaults to 10)
    - **Output**: JSON string with an array of matching chunk objects.

## Development

- **Linting**: `npm run lint` (Uses ESLint)
- **Watch mode (for development)**: `npm run dev` (Re-transpiles on file changes)

## Note on Backend API

This MCP server acts as a bridge to a **PostgREST-compatible backend**. The actual storage, vector search (`pgvector`), and advanced filtering logic are handled by your PostgreSQL database and exposed via the PostgREST service, using the specific table (`chunks`) and SQL functions (`match_chunks`, `filter_chunks_by_meta`) outlined in the "Backend Setup" section. Ensure your PostgREST service is correctly configured to expose these.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
