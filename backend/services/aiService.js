import { HumbleAIClient } from "../clients/humbleAIClient.js";
import { OpenAIClient } from "../clients/openaiClient.js";

class AIService {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
    this.client = this.initializeClient();
  }

  initializeClient() {
    if (this.provider === "humble") {
      return new HumbleAIClient(
        this.config.HUMBLE_API_KEY,
        this.config.HUMBLE_BASE_ID,
        this.config.OPENAI_API_KEY
      );
    } else if (this.provider === "openai") {
      return new OpenAIClient(this.config.OPENAI_API_KEY);
    } else {
      throw new Error(`Unknown AI provider: ${this.provider}`);
    }
  }

  async createChat() {
    return await this.client.createChat();
  }

  async getChat(chatId) {
    return await this.client.getChat(chatId);
  }

  async postMessage(chatId, content, jsonSchema) {
    return await this.client.postMessage(chatId, content, jsonSchema);
  }

  async processQuery(content, jsonSchema) {
    return await this.client.processQuery(content, jsonSchema);
  }

  async deleteChat(chatId) {
    return await this.client.deleteChat(chatId);
  }

  getProvider() {
    return this.provider;
  }
}

export { AIService };
