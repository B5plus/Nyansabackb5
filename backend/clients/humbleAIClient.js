import axios from "axios";
import { randomUUID } from "crypto";

/**
 * Client for the Humble AI platform.
 *
 * IMPORTANT — verified API contract (the old /api/assistant/... paths and
 * `Authorization: Token` scheme were wrong and always 404'd):
 *   Host:     https://platform.thehumbleai.com
 *   Auth:     header  x-api-key: hum_...
 *   Generate: POST /llm/chat/v1   (set stream:false for a single JSON response)
 *     - new chat:      body.chat = { new: true }         -> returns chat["chat/uuid"]
 *     - continue chat: body.chat = { "chat/uuid": <id> } -> preserves context
 *     - the assistant/model-config id (formerly "baseId") goes in traits + rag
 *
 * The platform generates the real chat id only on the first message, so this
 * client hands the frontend a local session id up front (createChat) and maps
 * it to the server chat id on the first postMessage. The map lives on the
 * singleton client instance, so context is preserved for the process lifetime.
 */
export class HumbleAIClient {
  constructor(humbleApiKey, modelConfigId, openaiApiKey) {
    this.humbleApiKey = humbleApiKey;
    // Formerly called "baseId" — it is the Humble AI model-config uuid.
    this.modelConfigId = modelConfigId;
    this.openaiApiKey = openaiApiKey; // unused: Humble manages the LLM key server-side
    this.baseURL = "https://platform.thehumbleai.com";

    // sessionId (given to the frontend) -> server "chat/uuid" (or null until first message)
    this.sessions = new Map();

    if (!humbleApiKey) {
      console.error("ERROR: HUMBLE_API_KEY is not set!");
    }
    if (!modelConfigId) {
      console.error("ERROR: HUMBLE_BASE_ID (model config id) is not set!");
    }

    console.log("HumbleAIClient initialized with:");
    console.log("  Base URL:", this.baseURL);
    console.log("  Model config ID:", this.modelConfigId);
    console.log("  Humble API Key present:", !!humbleApiKey);

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": humbleApiKey,
      },
    });
  }

  /**
   * Start a new chat session.
   *
   * The platform has no "create empty chat" call — a chat is created by the
   * first message. So we mint a local session id and defer creating the server
   * chat until postMessage. The frontend uses this id in the message URL.
   */
  async createChat() {
    const sessionId = randomUUID();
    this.sessions.set(sessionId, null);
    console.log("Created chat session:", sessionId);
    return {
      id: sessionId,
      baseId: this.modelConfigId,
      messages: [],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get chat metadata.
   *
   * History isn't tracked in this backend; return a lightweight placeholder so
   * callers don't error.
   */
  async getChat(chatId) {
    return {
      id: chatId,
      baseId: this.modelConfigId,
      serverChatId: this.sessions.get(chatId) || null,
      messages: [],
    };
  }

  /**
   * Send a message and get the assistant's reply.
   * POST /llm/chat/v1  (stream:false -> single JSON)
   */
  async postMessage(chatId, content, jsonSchema = null) {
    if (!content || typeof content !== "string") {
      throw new Error(
        `Content must be a non-empty string, received: ${typeof content}`
      );
    }

    // Resume the server-side chat if we've seen this session before.
    const serverChatId = this.sessions.get(chatId) || null;
    const chatField = serverChatId ? { "chat/uuid": serverChatId } : { new: true };

    const data = await this.generate(content, chatField, jsonSchema);

    // Remember the server chat id so the next message keeps context.
    const newServerChatId = data?.chat?.["chat/uuid"];
    if (newServerChatId) {
      this.sessions.set(chatId, newServerChatId);
    }

    return {
      content: data?.content ?? "",
      role: data?.role || "assistant",
      chatId,
      serverChatId: newServerChatId || serverChatId,
    };
  }

  /**
   * One-off query without a persisted session (always a fresh chat).
   * POST /llm/chat/v1
   */
  async processQuery(content, jsonSchema = null) {
    if (!content || typeof content !== "string") {
      throw new Error(
        `Content must be a non-empty string, received: ${typeof content}`
      );
    }
    const data = await this.generate(content, { new: true }, jsonSchema);
    return data?.content ?? "";
  }

  /**
   * End a chat session (local cleanup; the platform keeps its own history).
   */
  async deleteChat(chatId) {
    this.sessions.delete(chatId);
    console.log("Deleted chat session:", chatId);
    return { id: chatId, deleted: true };
  }

  /**
   * Internal: call the Humble AI generation endpoint and return the parsed
   * response object. `chatField` is { new: true } or { "chat/uuid": id }.
   */
  async generate(content, chatField, jsonSchema = null) {
    const messages = [];
    if (jsonSchema) {
      // The endpoint has no dedicated schema param; steer via a system message.
      messages.push({
        role: "system",
        content:
          "Respond ONLY with valid JSON that matches this JSON schema, with no " +
          "extra text or markdown: " +
          JSON.stringify(jsonSchema),
      });
    }
    messages.push({ role: "user", content });

    const payload = {
      messages,
      traits: { "ai-model-config/uuid": this.modelConfigId },
      rag: { "ai-model-config/uuid": this.modelConfigId, provider: "rag-db" },
      chat: chatField,
      reason: {
        tool: "AI Assistant",
        action: "AI Chat",
        entity: ["ai-model-config/uuid", this.modelConfigId],
      },
      stream: false,
    };

    try {
      const response = await this.client.post("/llm/chat/v1", payload);
      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;
      console.error("Humble AI generate error:", errorMsg);
      console.error("Status code:", error.response?.status);
      console.error("Full error response:", error.response?.data);
      throw new Error(`Failed to get AI response: ${errorMsg}`);
    }
  }
}
