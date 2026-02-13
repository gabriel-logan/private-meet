import { base64UrlDecode } from "../../../shared/utils/general";

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

    const { sub, username } = payload;

    return {
      sub: typeof sub === "string" ? sub : undefined,
      username: typeof username === "string" ? username : undefined,
    };
  } catch {
    return {};
  }
}
