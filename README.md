# RagLit MCP Server

**RagLit** is a Model Context Protocol (MCP) server designed to facilitate document processing and retrieval for Retrieval Augmented Generation (RAG) pipelines. It acts as an interface to an external REST API that handles the persistent storage of document chunks, vector search, and metadata filtering.

## Features

- **MCP Compliant**: Implements the Model Context Protocol for standardized communication.
- **Document Ingestion**: Chunks documents, generates OpenAI embeddings, and sends them to a backend API for storage.
- **Semantic Search**: Searches for relevant document chunks based on semantic similarity to a query, by leveraging a backend vector search API.
- **Metadata Filtering**: Filters stored chunks based on exact metadata matches via the backend API.
- **Configurable**: Uses environment variables for easy configuration of API endpoints, keys, and embedding models.

## Project Structure

```
src/
├── index.ts                 # Main entry point for the server
├── server.ts                # MCP server implementation and tool registration
├── config.ts                # Configuration loading and validation
├── chunkers/
│   └── fixedChunker.ts      # Fixed-size (word count) chunking logic
├── services/
│   └── embedding.ts         # OpenAI embedding service integration
├── repositories/
│   ├── ChunkRepository.ts          # Interface for chunk storage and retrieval
│   └── RestApiChunkRepository.ts # Implementation using a REST API backend
└── tools/
    ├── chunkDocuments.ts    # MCP tool to chunk and store documents
    ├── searchChunks.ts      # MCP tool to search for relevant chunks
    └── filterMetadata.ts    # MCP tool to filter chunks by metadata

.env                         # Environment variable configuration (create this file)
package.json
tsconfig.json
README.md
```

## Prerequisites

- Node.js (v18 or later recommended)
- npm (usually comes with Node.js)
- Access to an OpenAI API key for generating embeddings.
- A running instance of the backend REST API that RagLit will communicate with for chunk storage and retrieval. This API needs to expose at least the following endpoints:
  - `POST /chunks`: To store new chunks.
  - `POST /chunks/search`: To perform semantic search on chunks.
  - `POST /chunks/filter`: To filter chunks by metadata.

## Setup

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
    # Required: Base URL for your backend RAG API
    API_BASE_URL=http://localhost:3001/api

    # Required: Your OpenAI API Key
    OPENAI_API_KEY=sk-yourOpenAiApiKey

    # Optional: API Key for your backend RAG API (if it requires authentication)
    # API_KEY=yourBackendApiKey

    # Optional: OpenAI Embedding Model to use
    # Defaults to 'text-embedding-3-small' if not set
    # EMBEDDING_MODEL=text-embedding-3-small
    ```

    Replace the placeholder values with your actual API base URL and keys.

## Building the Server

To transpile the TypeScript code to JavaScript:

```bash
npm run build
```

This will create a `dist` directory with the compiled JavaScript files.

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

This MCP server acts as a bridge. The actual storage, vector search, and advanced filtering logic must be implemented in the backend REST API specified by `API_BASE_URL`.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
