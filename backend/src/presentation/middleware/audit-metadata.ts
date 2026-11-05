const sensitiveFieldPattern =
  /password|token|secret|authorization|cookie|credential|api.?key|email|phone|address|birth|ssn|card|search|customer.?name|full.?name|user.?id/i;
const maximumMetadataBytes = 8 * 1024;
const maximumDepth = 6;

function sanitizeValue(
  value: unknown,
  key = "",
  depth = 0,
  sensitiveParent = false,
): unknown {
  if (sensitiveFieldPattern.test(key) || sensitiveParent) return "";
  if (value === null || typeof value === "boolean" || typeof value === "number")
    return value;
  if (typeof value === "string") return value.slice(0, 500);
  if (depth >= maximumDepth) return "[MAX_DEPTH]";

  if (Array.isArray(value)) {
    return value
      .slice(0, 100)
      .map((item) => sanitizeValue(item, "", depth + 1, sensitiveParent));
  }
  if (typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  const sensitiveFilterValue =
    typeof record.field === "string" &&
    sensitiveFieldPattern.test(record.field);
  return Object.fromEntries(
    Object.entries(record)
      .slice(0, 100)
      .map(([childKey, childValue]) => [
        childKey,
        sanitizeValue(
          childValue,
          childKey,
          depth + 1,
          sensitiveFilterValue &&
            (childKey === "value" || childKey === "values"),
        ),
      ])
      .filter(([, childValue]) => childValue !== undefined),
  );
}

export function auditRequestMetadata(body: unknown): Record<string, unknown> {
  if (
    body === null ||
    typeof body !== "object" ||
    (!Array.isArray(body) && Object.keys(body).length === 0)
  ) {
    return {};
  }

  const requestBody = sanitizeValue(body);
  const metadata = { requestBody };
  if (
    Buffer.byteLength(JSON.stringify(metadata), "utf8") <= maximumMetadataBytes
  )
    return metadata;

  return {
    requestBody: {
      truncated: true,
      reason: "Sanitized request body exceeded the audit metadata size limit.",
    },
  };
}
