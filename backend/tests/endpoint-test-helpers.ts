import type { Request, RequestHandler, Response } from "express";
import { HTTPContextAccessor } from "@infrastructure/config/http-context-accessor";
import type { ShopRequest } from "@presentation/middleware/shop-auth.middleware";

interface RouteLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: RequestHandler }>;
  };
}

interface RouterLike {
  stack: RouteLayer[];
}

export interface EndpointResult {
  statusCode: number;
  body?: unknown;
  headers: Record<string, string>;
  contentType?: string;
}

export type EndpointRequest = Omit<Partial<Request>, "get"> & {
  auth?: ShopRequest["auth"];
  get?: (name: string) => string | undefined;
};

export function invokeEndpoint(
  router: unknown,
  method: string,
  path: string,
  request: EndpointRequest = {},
  context?: { userId: string; email: string; permissions: string[] },
): Promise<EndpointResult> {
  const layer = (router as RouterLike).stack.find(
    (candidate) =>
      candidate.route?.path === path && candidate.route.methods[method.toLowerCase()],
  );
  if (!layer?.route) {
    return Promise.reject(new Error(`Missing route ${method} ${path}`));
  }
  const handler = layer.route.stack.at(-1)?.handle;
  if (!handler) {
    return Promise.reject(new Error(`Missing handler ${method} ${path}`));
  }

  return new Promise((resolve, reject) => {
    const result: EndpointResult = {
      statusCode: 200,
      headers: {},
    };
    const response = {
      status(statusCode: number) {
        result.statusCode = statusCode;
        return this;
      },
      json(body: unknown) {
        result.body = body;
        resolve(result);
        return this;
      },
      send(body?: unknown) {
        result.body = body;
        resolve(result);
        return this;
      },
      setHeader(name: string, value: string) {
        result.headers[name.toLowerCase()] = value;
        return this;
      },
      type(contentType: string) {
        result.contentType = contentType;
        return this;
      },
    } as unknown as Response;
    const invoke = () =>
      handler(
        {
          params: {},
          query: {},
          body: {},
          ...request,
        } as Request,
        response,
        (error?: unknown) => reject(error ?? new Error("Route called next().")),
      );

    try {
      if (context) {
        HTTPContextAccessor.run(context, invoke);
      } else {
        invoke();
      }
    } catch (error) {
      reject(error);
    }
  });
}

export function stubMethod<T extends object, K extends keyof T>(
  target: T,
  method: K,
  replacement: T[K],
): () => void {
  const original = target[method];
  target[method] = replacement;
  return () => {
    target[method] = original;
  };
}
