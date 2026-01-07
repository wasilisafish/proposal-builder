import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: Plugin[] = [react()];
  
  // Only add express plugin in dev mode to avoid build-time import issues
  if (mode === "development") {
    plugins.push({
      name: "express-plugin",
      apply: "serve",
      async configureServer(server) {
        // Dynamic import with string literal to prevent static analysis
        const serverPath = "./server/index";
        const serverModule = await import(serverPath);
        const app = serverModule.createServer();
        server.middlewares.use(app);
      },
    });
  }

  return {
    server: {
      host: "::",
      port: 8080,
      fs: {
        allow: ["./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
    },
    build: {
      outDir: "dist/spa",
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});
