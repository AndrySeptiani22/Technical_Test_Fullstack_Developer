import type { ZodError } from "zod";

export function fieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.map(String).join(".");
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
