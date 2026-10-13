import type { IncomingMessage, ServerResponse } from "node:http";

import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";

/* ═══════════════════════════════════════════════════════════════════
   DEV-ONLY API SHIM

   In production, `api/*.ts` are Vercel serverless functions and Vite
   never sees them. In development Vite is the only server running, so
   without this the competitor gate cannot be tested at all without
   `vercel dev` and a login to the club account.

   This mounts the same handler files on the same paths, shimming the
   three Vercel-specific bits of the response object (`status`, `json`,
   `send`) and parsing the JSON body. `apply: "serve"` keeps every line
   of it out of the production build.
   ═══════════════════════════════════════════════════════════════════ */
function devApi(): Plugin {
  return {
    name: "chocolathon-dev-api",
    apply: "serve",

    /* The handlers read plain `process.env`, because that is what they get
       on Vercel. Vite does not put un-prefixed vars there, so load
       `.env.local` in by hand — that is where PROMPTS_UNLOCKED goes for a
       local preview. `*.local` is already gitignored. */
    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), "");
      for (const key of [
        "PROMPTS_RELEASE_AT",
        "PROMPTS_UNLOCKED",
        "BLOB_READ_WRITE_TOKEN",
        "UPLOAD_KEY",
      ]) {
        if (env[key] && !process.env[key]) process.env[key] = env[key];
      }
    },

    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        /* Also serve the API under the /chocolathon mount point. */
        const url = (req.url ?? "").replace(/^\/chocolathon(?=\/api\/)/, "");
        if (!url.startsWith("/api/")) return next();

        const route = url.split("?")[0].replace(/^\/api\//, "").replace(/\/$/, "");
        if (!/^[a-z0-9-]+$/i.test(route)) return next();

        try {
          const body = await readBody(req);
          const mod = await server.ssrLoadModule(`/api/${route}.ts`);
          const shimmed = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return shimmed;
            },
            json(payload: unknown) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(payload));
              return shimmed;
            },
            send(payload: string) {
              res.end(payload);
              return shimmed;
            },
          });
          Object.assign(req, { body, query: {} });
          await mod.default(req, shimmed);
        } catch (err) {
          /* A 404 from ssrLoadModule means "no such endpoint"; anything
             else is a real bug and should be loud in the terminal. */
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("Failed to load url")) return next();
          server.config.logger.error(`[dev-api] /api/${route}: ${message}`);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Dev API error — see the terminal." }));
        }
      });
    },
  };
}

function readBody(req: IncomingMessage): Promise<unknown> {
  if (req.method !== "POST" && req.method !== "PUT") return Promise.resolve({});
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApi()],
  build: { assetsDir: "chocolathon/assets" },
  server: {
    port: 8080,
  },
});
