import { base64UrlDecode } from "../utils";

export function parseJwt(token?: string): { sub?: string; username?: string } {
  if (!token) {
    return {};
  }

  const parts = token.split(".");

  if (parts.length < 2) {
    return {};
  }

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<
      string,
      unknown
    >;
    return {
      sub: typeof payload.sub === "string" ? payload.sub : undefined,
      username:
        typeof payload.username === "string" ? payload.username : undefined,
    };
  } catch {
    return {};
  }
}
