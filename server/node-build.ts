import path from "path";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
// From dist/server/node-build.mjs, go up one level to dist, then into spa
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
// API routes are handled by routes registered in createServer()
app.use((req, res, next) => {
  // Skip if this is an API route - let Express handle it naturally
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    // If no route matched, return 404 for API routes
    if (!res.headersSent) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    return;
  }
  // Serve index.html for all other routes (SPA routing)
  if (!res.headersSent) {
    res.sendFile(path.join(distPath, "index.html"));
  }
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
