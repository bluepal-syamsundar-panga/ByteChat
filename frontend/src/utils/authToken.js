export function hasValidAccessToken(token) {
  if (!token) return false;

  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) return false;

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const payload = JSON.parse(window.atob(padded));

    if (!payload?.exp) {
      return true;
    }

    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
