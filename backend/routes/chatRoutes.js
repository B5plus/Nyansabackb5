import express from "express";
import { ChatController } from "../controllers/chatController.js";

export function createChatRoutes(aiService) {
  const router = express.Router();
  const chatController = new ChatController(aiService);

  /**
   * Get provider info (MUST be before /:chatId routes)
   * GET /api/chat/info/provider
   */
  router.get("/info/provider", (req, res) =>
    chatController.getProviderInfo(req, res)
  );

  /**
   * Create a new chat
   * POST /api/chat/create
   */
  router.post("/create", (req, res, next) =>
    chatController.createChat(req, res, next)
  );

  /**
   * Process query without chat
   * POST /api/chat/query
   */
  router.post("/query", (req, res, next) =>
    chatController.processQuery(req, res, next)
  );

  /**
   * Post message to chat
   * POST /api/chat/:chatId/message
   */
  router.post("/:chatId/message", (req, res, next) =>
    chatController.postMessage(req, res, next)
  );

  /**
   * Get chat with messages
   * GET /api/chat/:chatId
   */
  router.get("/:chatId", (req, res, next) =>
    chatController.getChat(req, res, next)
  );

  /**
   * Delete chat
   * DELETE /api/chat/:chatId
   */
  router.delete("/:chatId", (req, res, next) =>
    chatController.deleteChat(req, res, next)
  );

  return router;
}

