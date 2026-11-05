import "reflect-metadata";

import app from "./app";
import dataSource from "@infrastructure/config/db-context";
import appConfig from "@infrastructure/config/app-config";

const port = appConfig.port;
const host = appConfig.host ?? "127.0.0.1";

async function startServer(): Promise<void> {
  if (!process.env.APP_JWT_SECRET || process.env.APP_JWT_SECRET.length < 32) {
    throw new Error("APP_JWT_SECRET must contain at least 32 characters.");
  }

  try {
    await dataSource.initialize();
    console.log("✓ PostgreSQL connected");
  } catch (error) {
    console.error("✗ PostgreSQL connection failed");
    throw error;
  }

  const server = app.listen(port, host, () => {
    console.log(`✓ Server running at http://${host}:${port}`);
  });
  server.on("error", (error) => {
    console.error("✗ Failed to start HTTP server");
    console.error(error);
    process.exit(1);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received; closing server`);
    server.close((error) => {
      if (error) {
        console.error("✗ Failed to close HTTP server cleanly", error);
        process.exitCode = 1;
      }
      if (dataSource.isInitialized) {
        void dataSource.destroy().catch((shutdownError: unknown) => {
          console.error(
            "✗ Failed to disconnect PostgreSQL cleanly",
            shutdownError,
          );
          process.exitCode = 1;
        });
      }
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

void startServer().catch((error: unknown) => {
  console.error("✗ Backend startup failed", error);
  process.exitCode = 1;
});
