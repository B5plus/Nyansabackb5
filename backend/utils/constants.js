// API Configuration
export const API_CONFIG = {
  HUMBLE_AI: {
    BASE_URL: "https://platform.thehumbleai.com/api/assistant",
    TIMEOUT: 30000,
  },
  OPENAI: {
    MODEL: "gpt-3.5-turbo",
    TEMPERATURE: 0.7,
    MAX_TOKENS: 1000,
  },
};

// Provider Types
export const PROVIDERS = {
  HUMBLE: "humble",
  OPENAI: "openai",
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_PROVIDER: "Unknown AI provider",
  MISSING_API_KEY: "API key is required",
  MISSING_BASE_ID: "Base ID is required",
  CHAT_NOT_FOUND: "Chat not found",
  INVALID_CONTENT: "Content is required",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CHAT_CREATED: "Chat created successfully",
  CHAT_DELETED: "Chat deleted successfully",
  MESSAGE_SENT: "Message sent successfully",
};

