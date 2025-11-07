import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { AIService } from "./services/aiService.js";
import { createChatRoutes } from "./routes/chatRoutes.js";
import { Logger } from "./utils/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_PROVIDER = process.env.AI_PROVIDER || "openai";

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.method === "POST" || req.method === "PUT") {
    console.log(`[${req.method}] ${req.path}`);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
  }
  next();
});

// Initialize AI Service
const aiService = new AIService(AI_PROVIDER, {
  HUMBLE_API_KEY: process.env.HUMBLE_API_KEY,
  HUMBLE_BASE_ID: process.env.HUMBLE_BASE_ID,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
});

// Debug: Log API key status
console.log("API Key Configuration:");
console.log("  HUMBLE_API_KEY present:", !!process.env.HUMBLE_API_KEY);
console.log("  HUMBLE_BASE_ID present:", !!process.env.HUMBLE_BASE_ID);
console.log("  OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
if (process.env.OPENAI_API_KEY) {
  console.log("  OPENAI_API_KEY length:", process.env.OPENAI_API_KEY.length);
  console.log(
    "  OPENAI_API_KEY starts with:",
    process.env.OPENAI_API_KEY.substring(0, 20)
  );
  console.log(
    "  OPENAI_API_KEY ends with:",
    process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 10)
  );
}

Logger.success(`Using ${AI_PROVIDER} provider`);

// Routes
app.use("/api/chat", createChatRoutes(aiService));

// Health check
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", message: "Humble AI Chatbot is running" });
});

// Root path - show server status
app.get("/", (_, res) => {
  res.json({
    status: "running",
    message: "Nyansa AI Chatbot Backend is running on port " + PORT,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  Logger.error("Request error", err.message);
  console.error("Full error stack:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  Logger.success(`Humble AI Chatbot server running on port ${PORT}`);
});
