import axios from "axios";

export class HumbleAIClient {
  constructor(humbleApiKey, baseId, openaiApiKey) {
    this.humbleApiKey = humbleApiKey;
    this.baseId = baseId;
    this.openaiApiKey = openaiApiKey;
    this.baseURL = "https://platform.thehumbleai.com/api/assistant";

    // Validate credentials
    if (!humbleApiKey) {
      console.error("ERROR: HUMBLE_API_KEY is not set!");
    }
    if (!baseId) {
      console.error("ERROR: HUMBLE_BASE_ID is not set!");
    }
    if (!openaiApiKey) {
      console.error(
        "ERROR: OPENAI_API_KEY is not set! Humble AI requires OpenAI key."
      );
    }

    console.log("HumbleAIClient initialized with:");
    console.log("  Base URL:", this.baseURL);
    console.log("  Base ID:", this.baseId);
    console.log("  Humble API Key present:", !!humbleApiKey);
    console.log("  OpenAI API Key present:", !!openaiApiKey);

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${humbleApiKey}`,
      },
    });
  }

  /**
   * Create a new chat
   * POST /api/assistant/chats/{baseId}
   */
  async createChat() {
    try {
      console.log("Creating chat with baseId:", this.baseId);
      const response = await this.client.post(`/chats/${this.baseId}`, {});
      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;
      console.error("Create chat error:", errorMsg);
      console.error("Full error response:", error.response?.data);
      console.error("Status code:", error.response?.status);
      throw new Error(`Failed to create chat: ${errorMsg}`);
    }
  }

  /**
   * Get chat with messages
   * GET /api/assistant/chats/{chatId}
   */
  async getChat(chatId) {
    try {
      const response = await this.client.get(`/chats/${chatId}`);
      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;
      console.error("Get chat error:", errorMsg);
      throw new Error(`Failed to get chat: ${errorMsg}`);
    }
  }

  /**
   * Post message to chat
   * NOTE: Using /bases/{baseId}/queries endpoint instead of /messages/{chatId}
   * because the messages endpoint has a bug in Humble AI API
   * POST /api/assistant/bases/{baseId}/queries
   * Payload: { "content": "...", "jsonSchema": {...} }
   */
  async postMessage(chatId, content, jsonSchema = null) {
    try {
      console.log("Posting message (using queries endpoint)");
      console.log("Chat ID:", chatId);
      console.log("Content:", content);
      console.log("Content type:", typeof content);

      // Validate content
      if (!content || typeof content !== "string") {
        throw new Error(
          `Content must be a non-empty string, received: ${typeof content}`
        );
      }

      // Humble AI API requires content and jsonSchema (not response_format)
      let payload = {
        content,
      };

      // Add jsonSchema if provided (Humble AI uses jsonSchema, not response_format)
      if (jsonSchema) {
        payload.jsonSchema = jsonSchema;
      }

      console.log("=== SENDING REQUEST ===");
      console.log("Payload:", JSON.stringify(payload));
      console.log("Full URL:", `${this.baseURL}/bases/${this.baseId}/queries`);

      // Use the queries endpoint which works correctly
      const response = await this.client.post(
        `/bases/${this.baseId}/queries`,
        payload
      );
      console.log("Success! Response:", response.data);

      // Return in a format compatible with the chat message structure
      return {
        content: response.data,
        role: "assistant",
        chatId: chatId,
      };
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;
      console.error("=== POST MESSAGE ERROR ===");
      console.error(
        "URL attempted:",
        `${this.baseURL}/bases/${this.baseId}/queries`
      );
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
      console.error("Error message:", errorMsg);
      throw new Error(`Failed to post message: ${errorMsg}`);
    }
  }

  /**
   * Process query without chat
   * POST /api/assistant/bases/{baseId}/queries
   * Payload: { "content": "...", "jsonSchema": {...} }
   */
  async processQuery(content, jsonSchema = null) {
    try {
      const payload = {
        content,
      };

      // Add jsonSchema if provided (Humble AI uses jsonSchema, not response_format)
      if (jsonSchema) {
        payload.jsonSchema = jsonSchema;
      }

      const response = await this.client.post(
        `/bases/${this.baseId}/queries`,
        payload
      );
      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;
      console.error("Process query error:", errorMsg);
      throw new Error(`Failed to process query: ${errorMsg}`);
    }
  }

  /**
   * Delete chat
   * DELETE /api/assistant/chats/{chatId}
   */
  async deleteChat(chatId) {
    try {
      const response = await this.client.delete(`/chats/${chatId}`);
      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;
      console.error("Delete chat error:", errorMsg);
      throw new Error(`Failed to delete chat: ${errorMsg}`);
    }
  }
}
