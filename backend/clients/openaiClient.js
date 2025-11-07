import OpenAI from 'openai';

export class OpenAIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = new OpenAI({ apiKey });
    this.conversationHistory = new Map(); // Store conversation history by chatId
  }

  /**
   * Create a new chat session
   */
  async createChat() {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.conversationHistory.set(chatId, []);
    return { id: chatId, created_at: new Date().toISOString() };
  }

  /**
   * Get chat with messages
   */
  async getChat(chatId) {
    const messages = this.conversationHistory.get(chatId) || [];
    return {
      id: chatId,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    };
  }

  /**
   * Post message to chat and get response
   */
  async postMessage(chatId, content, jsonSchema = null) {
    try {
      // Get or initialize conversation history
      if (!this.conversationHistory.has(chatId)) {
        this.conversationHistory.set(chatId, []);
      }

      const history = this.conversationHistory.get(chatId);

      // Add user message to history
      history.push({
        role: 'user',
        content: content
      });

      // Prepare messages for API
      const messages = history.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Build request options
      const requestOptions = {
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      };

      // Add JSON schema if provided
      if (jsonSchema) {
        requestOptions.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'response',
            schema: jsonSchema,
            strict: false
          }
        };
      }

      // Get response from OpenAI
      const response = await this.client.chat.completions.create(requestOptions);

      const assistantMessage = response.choices[0].message.content;

      // Add assistant message to history
      history.push({
        role: 'assistant',
        content: assistantMessage
      });

      return {
        id: chatId,
        user_message: content,
        assistant_message: assistantMessage,
        messages: history.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Process query without chat history
   */
  async processQuery(content, jsonSchema = null) {
    try {
      const requestOptions = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content }],
        temperature: 0.7,
        max_tokens: 1000
      };

      if (jsonSchema) {
        requestOptions.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'response',
            schema: jsonSchema,
            strict: false
          }
        };
      }

      const response = await this.client.chat.completions.create(requestOptions);

      return {
        content: response.choices[0].message.content,
        model: response.model,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Delete chat
   */
  async deleteChat(chatId) {
    this.conversationHistory.delete(chatId);
    return { success: true, message: 'Chat deleted' };
  }

  /**
   * Clear all chats
   */
  clearAllChats() {
    this.conversationHistory.clear();
  }
}

