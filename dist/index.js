import { main } from "./server.js";
import dotenv from "dotenv";
// Load environment variables from .env file
// This allows configuration through a .env file instead of hardcoding
dotenv.config();
// Start the server
main().catch((err) => {
    console.error("Failed to start server", err);
    // Exit the process with an error code if the server fails to start
    process.exit(1);
});
//# sourceMappingURL=index.js.map