import app from "./app.js";
import env from "./config/env.js";
import { initSocket } from "./config/socket.js";
import { connectRedis } from "./config/redis.js";
import { seedSuperAdmin } from "./utils/seedSuperAdmin.js";
import { TokenBlacklistService } from "./modules/auth/tokenBlacklist.service.js";

let server: any;
let cleanupInterval: NodeJS.Timeout | null = null;

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception detected. Shutting down...");
  console.error(error);
  process.exit(1);
});

async function bootstrap() {
  try {
    await seedSuperAdmin();
    await connectRedis();

    await TokenBlacklistService.cleanupExpiredTokens();
    cleanupInterval = setInterval(async () => {
      try {
        await TokenBlacklistService.cleanupExpiredTokens();
      } catch (err) {
        console.error("Error during token blacklist cleanup:", err);
      }
    }, 6 * 60 * 60 * 1000);
    cleanupInterval.unref();

    server = app.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
    });

    initSocket(server);
  } catch (error) {
    console.error("Error during server startup:", error);
    process.exit(1);
  }
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection detected. Shutting down...");
  console.error(error);

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received.");
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  }
});

process.on("SIGINT", () => {
  console.log("SIGINT received.");
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  }
});

bootstrap();
