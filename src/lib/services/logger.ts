// =============================================================================
// AI Radar — Server-Side Safe Logger
// =============================================================================
// Enforces sanitization of sensitive data before logging.
// Never logs:
//   - Passwords
//   - API keys
//   - Bearer/Auth tokens
//   - Service role keys
//   - Sensitive user credentials
// =============================================================================

const SENSITIVE_KEYS = new Set([
  'password',
  'secret',
  'apikey',
  'api_key',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'servicerolekey',
  'service_role_key',
  'authorization',
]);

function redactValue(key: string, value: unknown): unknown {
  const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');
  if (SENSITIVE_KEYS.has(normalizedKey)) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    // Redact Bearer tokens if found in strings
    if (/bearer\s+[a-z0-9._~+/-]+=*/i.test(value)) {
      return value.replace(/bearer\s+[a-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED]');
    }
    // Redact standard API key patterns (e.g. sk-..., eyJ...)
    if (/^(sk-[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9_-]{20,})/.test(value)) {
      return '[REDACTED_TOKEN]';
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitizedObj[k] = redactValue(k, v);
    }
    return sanitizedObj;
  }

  if (Array.isArray(value)) {
    return value.map((item, idx) => redactValue(String(idx), item));
  }

  return value;
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const sanitized = context ? redactValue('context', context) : undefined;
    if (sanitized) {
      console.log(`[INFO] ${message}`, JSON.stringify(sanitized));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },

  warn(message: string, context?: Record<string, unknown>) {
    const sanitized = context ? redactValue('context', context) : undefined;
    if (sanitized) {
      console.warn(`[WARN] ${message}`, JSON.stringify(sanitized));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const errMessage = error instanceof Error ? error.message : String(error ?? '');
    const sanitizedContext = context ? redactValue('context', context) : undefined;
    console.error(
      `[ERROR] ${message} | Details: ${errMessage}`,
      sanitizedContext ? JSON.stringify(sanitizedContext) : ''
    );
  },

  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      const sanitized = context ? redactValue('context', context) : undefined;
      if (sanitized) {
        console.debug(`[DEBUG] ${message}`, JSON.stringify(sanitized));
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  },
};
