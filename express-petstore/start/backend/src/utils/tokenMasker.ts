/**
 * Token masking utility for secure logging
 *
 * This utility masks sensitive tokens in logs while preserving enough
 * information for debugging and correlation.
 */

/**
 * Masks a JWT token for safe logging
 * Shows first 8 and last 4 characters with token type info
 */
export function maskJWTToken(token: string): string {
  if (!token) return '[no-token]';

  // Remove 'Bearer ' prefix if present
  const cleanToken = token.replace(/^Bearer\s+/i, '');

  if (cleanToken.length < 20) {
    return '[invalid-token]';
  }

  // For JWT tokens, try to extract header info safely
  try {
    const parts = cleanToken.split('.');
    if (parts.length === 3) {
      // It's a JWT token
      const headerB64 = parts[0];
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());

      return `[JWT:${header.alg || 'unknown'}:${cleanToken.substring(
        0,
        8
      )}...${cleanToken.substring(cleanToken.length - 4)}]`;
    }
  } catch {
    // Fall through to generic masking
  }

  // Generic token masking
  return `[TOKEN:${cleanToken.substring(0, 8)}...${cleanToken.substring(
    cleanToken.length - 4
  )}]`;
}

/**
 * Masks authorization headers in request headers object
 */
export function maskAuthHeaders(
  headers: Record<string, unknown>
): Record<string, unknown> {
  const masked = { ...headers };

  // Mask common auth header variations
  const authKeys = ['authorization', 'Authorization', 'auth', 'Auth'];

  for (const key of authKeys) {
    if (masked[key]) {
      if (Array.isArray(masked[key])) {
        masked[key] = (masked[key] as string[]).map(maskJWTToken);
      } else {
        masked[key] = maskJWTToken(masked[key] as string);
      }
    }
  }

  return masked;
}

/**
 * Extracts safe token info for correlation/debugging
 */
export function getTokenCorrelationId(token: string): string {
  if (!token) return 'no-token';

  const cleanToken = token.replace(/^Bearer\s+/i, '');

  try {
    const parts = cleanToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      // Use JTI (JWT ID) if available, otherwise create a short hash
      return payload.jti || `jwt-${cleanToken.substring(0, 8)}`;
    }
  } catch {
    // Fall through
  }

  return `token-${cleanToken.substring(0, 8)}`;
}
