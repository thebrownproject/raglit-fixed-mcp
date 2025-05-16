import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { chunkDocumentTool } from "./tools/chunkDocuments.js";
import { searchChunksTool } from "./tools/searchChunks.js";
import { filterMetadataTool } from "./tools/filterMetadata.js";
/**
 * Initializes and starts the MCP (Model Context Protocol) server.
 * This server provides capabilities for document chunking and searching.
 */
export async function main() {
    // Instantiate the MCP server with metadata and capabilities.
    const server = new McpServer({
        name: "raglit", // Updated name for the server
        version: "1.0.0", // Version of the server
        description: "RagLit: An MCP server for document chunking, embedding, and retrieval for RAG pipelines via a REST API.", // Updated description
    }, {
        capabilities: {
            tools: {}, // Enables the tools capability, allowing the server to offer specific functionalities.
        },
    });
    console.error("Initializing RagLit MCP server..."); // Updated log message
    // Register available tools with the server.
    // Each tool has a unique name, a schema defining its inputs/outputs, and a handler function.
    // Tool for chunking documents into smaller pieces.
    server.tool("chunk_document", chunkDocumentTool.schema.shape, chunkDocumentTool.handler);
    // Tool for searching relevant chunks based on a query.
    server.tool("search_chunks", searchChunksTool.schema.shape, searchChunksTool.handler);
    // Tool for filtering chunks based on their metadata.
    server.tool("filter_metadata", filterMetadataTool.schema.shape, filterMetadataTool.handler);
    // Create a standard input/output transport layer for communication.
    // This allows the server to communicate over stdio, typical for CLI tools.
    const transport = new StdioServerTransport();
    // Connect the server to the transport layer to begin listening for and handling requests.
    await server.connect(transport);
    console.error("RagLit MCP server is running and ready to accept requests." // Updated log message
    );
    // Set up a listener for the SIGINT signal (e.g., Ctrl+C) to gracefully shut down the server.
    process.on("SIGINT", () => {
        console.error("Shutting down RagLit MCP server..."); // Updated log message
        transport.close(); // Close the transport connection.
        process.exit(0); // Exit the process successfully.
    });
}
//# sourceMappingURL=server.js.map