import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { getDirectReminderWindowForUtcHour, recordDirectReminderCallbackAudit, sendControlledScheduleTest, sendDailyComebackReminders, sendDailyDirectBrowserReminders, type ReminderWindow } from "../db";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  const scheduledReminder = (window: ReminderWindow) => async (req: express.Request, res: express.Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const result = await sendDailyDirectBrowserReminders(window);
      return res.json({ ok: true, ...result, taskUid: user.taskUid });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : `${window}-comeback failed`,
        stack: error instanceof Error ? error.stack : undefined,
        context: { url: req.originalUrl, window },
        timestamp: new Date().toISOString(),
      });
    }
  };
  app.post("/api/scheduled/comeback-morning", scheduledReminder("morning"));
  app.post("/api/scheduled/comeback-afternoon", scheduledReminder("afternoon"));
  app.post("/api/scheduled/comeback-evening", scheduledReminder("evening"));
  app.post("/api/scheduled/comeback-controlled-test", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const result = await sendControlledScheduleTest();
      return res.json({ ok: true, ...result, taskUid: user.taskUid });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "controlled reminder test failed",
        stack: error instanceof Error ? error.stack : undefined,
        context: { url: req.originalUrl, window: "controlled-test" },
        timestamp: new Date().toISOString(),
      });
    }
  });
  // Keep the former callback path valid during schedule migration; it maps to the evening window.
  app.post("/api/scheduled/daily-comeback", scheduledReminder("evening"));
  app.post("/api/scheduled/direct-browser-reminder", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const hour = new Date().getUTCHours();
      const window: ReminderWindow | null = getDirectReminderWindowForUtcHour(hour);
      if (!window) {
        await recordDirectReminderCallbackAudit({ cronTaskUid: user.taskUid, window: null, outcome: "outside_window", observedUtcHour: hour });
        return res.json({ ok: true, skipped: "outside-direct-reminder-window", hour, taskUid: user.taskUid });
      }
      const result = await sendDailyDirectBrowserReminders(window);
      await recordDirectReminderCallbackAudit({ cronTaskUid: user.taskUid, window, outcome: result.sent > 0 ? "sent" : "skipped", observedUtcHour: hour, sent: result.sent, skipped: result.skipped, totalEnabled: result.totalEnabled, transport: result.transport });
      return res.json({ ok: true, ...result, taskUid: user.taskUid });
    } catch (error) {
      await recordDirectReminderCallbackAudit({ cronTaskUid: null, window: null, outcome: "failed", observedUtcHour: null });
      return res.status(500).json({ error: error instanceof Error ? error.message : "direct-browser reminder failed", stack: error instanceof Error ? error.stack : undefined, context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });
  // OneSignal appends a stable SDK query string to this root URL. Its worker can
  // otherwise stay cached after a repair, so always serve the current compatible
  // bootstrap as JavaScript before the static-app fallback can return index.html.
  app.get("/OneSignalSDKWorker.js", (_req, res) => {
    res
      .status(200)
      .set({
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      })
      .send('importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");\nimportScripts("/sw.js?onesignalRootWorker=1");\n');
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
