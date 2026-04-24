import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

/**
 * Minimal dev middleware that emulates Vercel serverless functions
 * for files under `api/`. Lets `npm run dev` serve both the SPA and
 * the `/api/*` routes without needing the Vercel CLI.
 *
 * Supports: body as JSON, query params, res.status().json()/send().
 */
function devApiPlugin(): Plugin {
  return {
    name: "dev-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        const url = new URL(req.url, "http://localhost");
        const routePath = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
        if (!routePath) return next();

        const handlerFile = path.resolve(process.cwd(), "api", routePath + ".ts");
        if (!fs.existsSync(handlerFile)) {
          res.statusCode = 404;
          res.end(`No handler found: api/${routePath}.ts`);
          return;
        }

        // Collect request body
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const raw = Buffer.concat(chunks).toString("utf-8");
        let body: unknown = {};
        if (raw) {
          const contentType = req.headers["content-type"] ?? "";
          if (contentType.includes("application/json")) {
            try {
              body = JSON.parse(raw);
            } catch {
              body = raw;
            }
          } else {
            body = raw;
          }
        }

        // Build query object
        const query: Record<string, string | string[]> = {};
        url.searchParams.forEach((v, k) => {
          const existing = query[k];
          if (existing === undefined) query[k] = v;
          else if (Array.isArray(existing)) existing.push(v);
          else query[k] = [existing, v];
        });

        // Mutate req/res to approximate VercelRequest/VercelResponse
        const fakeReq = Object.assign(req, { body, query, cookies: {} });
        const fakeRes = Object.assign(res, {
          status(code: number) {
            res.statusCode = code;
            return fakeRes;
          },
          json(data: unknown) {
            if (!res.headersSent) res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
            return fakeRes;
          },
          send(data: unknown) {
            if (typeof data === "string" || Buffer.isBuffer(data)) {
              res.end(data as string | Buffer);
            } else {
              if (!res.headersSent) res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            }
            return fakeRes;
          },
        });

        try {
          const mod = await server.ssrLoadModule(`/api/${routePath}.ts`);
          const handler = (mod as { default?: unknown }).default;
          if (typeof handler !== "function") {
            res.statusCode = 500;
            res.end(`api/${routePath}.ts has no default export`);
            return;
          }
          await handler(fakeReq, fakeRes);
        } catch (err) {
          console.error(`[dev-api] /api/${routePath} failed:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
          } else {
            res.end();
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load .env.local (and .env) into process.env so api handlers
  // can read SES_FROM, AWS_*, GHL_WEBHOOK_URL, etc.
  const env = loadEnv(mode, process.cwd(), "");
  for (const k of Object.keys(env)) {
    if (process.env[k] === undefined) process.env[k] = env[k];
  }

  return {
    plugins: [react(), devApiPlugin()],
    server: { port: 5173 },
  };
});
