import { UAParser } from "ua-parser-js";

export function getBrowserUserAgent(
  userAgent: string | undefined,
): string | null {
  if (!userAgent) return null;

  const browser = new UAParser(userAgent).getBrowser();
  return browser.name && browser.version
    ? `${browser.name}/${browser.version}`
    : browser.name ?? null;
}
