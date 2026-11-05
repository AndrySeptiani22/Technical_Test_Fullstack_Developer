import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

export function rateLimit(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
}): RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${options.keyPrefix}:${req.ip || req.socket.remoteAddress || "unknown"}`;
    const current = buckets.get(key);
    const bucket =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + options.windowMs }
        : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    if (buckets.size > 10_000) {
      for (const [bucketKey, value] of buckets)
        if (value.resetAt <= now) buckets.delete(bucketKey);
    }
    res.setHeader("RateLimit-Limit", options.max);
    res.setHeader(
      "RateLimit-Remaining",
      Math.max(0, options.max - bucket.count),
    );
    res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
    if (bucket.count > options.max) {
      res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        success: false,
        message: "Too many requests. Please try again later.",
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
        },
      });
      return;
    }
    next();
  };
}
