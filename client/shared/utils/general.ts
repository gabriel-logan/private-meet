export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function base64UrlDecode(input: string): string {
  const base64 = input.replaceAll("-", "+").replaceAll("_", "/");

  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  return atob(padded);
}

export function getTimeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isSafeUrl(url: string) {
  try {
    const u = new URL(url);

    return u.protocol === "blob:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function safeText(input: unknown): string {
  return typeof input === "string" ? input : "";
}

export function debugHandle(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log(...args);
}
