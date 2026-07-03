import "dotenv/config";
import { createApp } from "../server/app";
import { serveStatic } from "../server/_core/vite";

const app = createApp();

if (process.env.NODE_ENV === "production") {
  serveStatic(app);
}

export default app;
