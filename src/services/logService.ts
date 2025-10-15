// File: services/logService.ts
// PRF-COMPLIANT LOGGING SERVICE (2025-10-15)
// Adds module/source tracking and safer browser persistence.

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

/**
 * Centralized logger.
 * @param level - The log severity
 * @param message - Human-readable message
 * @param data - Optional structured payload
 * @param source - Optional string identifying the calling module
 */
export function logEvent(
  level: LogLevel,
  message: string,
  data?: any,
  source: string = "core"
) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${level}] [${source}] ${message}`;

  // Console output
  switch (level) {
    case "ERROR":
      console.error(formatted, data || "");
      break;
    case "WARN":
      console.warn(formatted, data || "");
      break;
    case "DEBUG":
      console.debug(formatted, data || "");
      break;
    default:
      console.log(formatted, data || "");
  }

  // Store logs for DebugLog viewer (browser only)
  try {
    (window as any).__APP_LOGS__ = (window as any).__APP_LOGS__ || [];
    (window as any).__APP_LOGS__.push({
      level,
      message,
      timestamp,
      data,
      source,
    });
  } catch {
    // Silently ignore if window unavailable
  }
}

export function getLogs() {
  return (window as any).__APP_LOGS__ || [];
}
