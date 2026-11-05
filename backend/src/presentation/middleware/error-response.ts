import { randomBytes } from "crypto";
import { STATUS_CODES } from "http";
import { Request, Response } from "express";

interface ErrorResponseBody {
  success: false;
  error: { code: string; message: string };
  stack?: string;
}

export function sendErrorResponse(
  req: Request,
  res: Response,
  statusCode: number,
  body: ErrorResponseBody,
): void {
  res.vary("Accept");
  res.setHeader("Cache-Control", "no-store");
  const accept = req.get("accept") ?? "";
  const wantsHtml =
    (req.method === "GET" || req.method === "HEAD") &&
    /\btext\/html\b/i.test(accept) &&
    req.accepts(["json", "html"]) === "html";

  if (!wantsHtml) {
    res.status(statusCode).json(body);
    return;
  }

  const nonce = randomBytes(16).toString("base64");
  const title = STATUS_CODES[statusCode] ?? "Request failed";
  const requestId = res.getHeader("X-Request-ID");
  res.locals.auditErrorResponse = body;
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'none'; style-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`,
  );
  res.status(statusCode).type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${statusCode} ${escapeHtml(title)}</title>
  <style nonce="${nonce}">
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; color: #202525; background: #f4f6f5;
      font-family: "Trebuchet MS", sans-serif; border-top: 6px solid #b43838; }
    main { width: min(100% - 48px, 720px); margin: 0 auto; padding: 96px 0 48px; }
    .status { margin: 0 0 24px; color: #b43838; font-size: 20px; font-weight: bold; }
    h1 { margin: 0 0 24px; font-family: Georgia, serif; font-size: 48px;
      font-weight: normal; line-height: 1.15; overflow-wrap: anywhere; }
    .message { font-size: 18px; line-height: 1.6; overflow-wrap: anywhere; }
    dl { margin: 36px 0; padding: 24px 0; border-block: 1px solid #d1d9d5; }
    dt { margin-top: 16px; color: #535e58; font-size: 13px; }
    dt:first-child { margin-top: 0; }
    dd { margin: 8px 0 0; font-family: monospace; font-size: 14px; overflow-wrap: anywhere; }
    a { color: #086b55; text-underline-offset: 4px; }
    a:focus-visible { outline: 3px solid #086b55; outline-offset: 5px; }
    @media (max-width: 480px) { main { padding-top: 56px; } h1 { font-size: 36px; } }
  </style>
</head>
<body>
  <main>
    <p class="status">${statusCode}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="message">${escapeHtml(body.error.message)}</p>
    <dl>
      <dt>Error code</dt><dd>${escapeHtml(body.error.code)}</dd>
      ${typeof requestId === "string" ? `<dt>Request ID</dt><dd>${escapeHtml(requestId)}</dd>` : ""}
    </dl>
  </main>
</body>
</html>`);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}