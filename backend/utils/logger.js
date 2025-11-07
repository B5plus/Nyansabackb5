// Simple Logger Utility
class Logger {
  static info(message, data = null) {
    console.log(`[INFO] ${message}`, data || "");
  }

  static error(message, error = null) {
    console.error(`[ERROR] ${message}`, error || "");
  }

  static warn(message, data = null) {
    console.warn(`[WARN] ${message}`, data || "");
  }

  static debug(message, data = null) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${message}`, data || "");
    }
  }

  static success(message, data = null) {
    console.log(`[SUCCESS] ✓ ${message}`, data || "");
  }
}

export { Logger };

