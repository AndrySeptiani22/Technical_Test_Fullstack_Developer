import jwt from "jsonwebtoken";

export const sanitizeHeaders = (headers: any) => {
  const cloned = { ...headers };
  delete cloned.authorization;
  delete cloned.cookie;
  return cloned;
};

export const extractEmail = (req: any): string | undefined => {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return undefined;

  const token = authHeader.split(" ")[1];
  if (!token) return undefined;

  try {
    const decoded: any = jwt.decode(token);
    return decoded?.email || decoded?.sub || undefined;
  } catch {
    return undefined;
  }
};
