import http from "node:http";
import { TFocusOrchestrator } from "../orchestrator.mjs";
import { config } from "../config.mjs";
import { PostgresPersistence } from "../persistence/postgres.mjs";
import { DurableStore } from "../persistence/durable-store.mjs";
import { assertAuthorized } from "../security.mjs";
import { requireObject, requireString } from "../validation.mjs";

const port = config.port;
const host = config.host;
const persistence = new PostgresPersistence();
await persistence.migrate();
const store = new DurableStore(persistence);
const orchestrator = new TFocusOrchestrator({ store, defaultMode: config.mode });

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" });
  res.end(JSON.stringify(body, null, 2));
}

async function body(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? `${host}:${port}`}`);
  try {
    if (req.method === "OPTIONS") return send(res, 204, {});
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const html = await (await import("node:fs/promises")).readFile(new URL("../../public/index.html", import.meta.url), "utf8");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(html); return;
    }
    if (url.pathname === "/app.js" || url.pathname === "/styles.css") {
      const fs = await import("node:fs/promises"); const file = await fs.readFile(new URL(`../../public/${url.pathname.slice(1)}`, import.meta.url));
      res.writeHead(200, { "content-type": url.pathname.endsWith(".js") ? "text/javascript" : "text/css" }); res.end(file); return;
    }
    if (url.pathname === "/health") return send(res, 200, { status: "ok", service: "tfocus-ai", mode: config.mode });
    if (url.pathname === "/ready") {
      await persistence.ping();
      return send(res, 200, { status: "ready", database: "ok" });
    }
    if (url.pathname.startsWith("/api/")) assertAuthorized(req);
    if (url.pathname === "/api/conversations/message" && req.method === "POST") {
      const input = requireObject(await body(req));
      return send(res, 200, orchestrator.handleMessage({ ...input, conversationId: requireString(input.conversationId, "conversationId"), text: requireString(input.text, "text", { max: 4000 }) }));
    }
    if (url.pathname === "/api/conversations/mode" && req.method === "POST") {
      const input = requireObject(await body(req));
      return send(res, 200, { success: true, data: orchestrator.setMode(requireString(input.conversationId, "conversationId"), requireString(input.mode, "mode")) });
    }
    if (url.pathname === "/api/tools" && req.method === "POST") {
      const input = requireObject(await body(req));
      return send(res, 200, orchestrator.tool(requireString(input.tool, "tool"), input.args ?? {}));
    }
    if (url.pathname === "/api/audit" && req.method === "GET") return send(res, 200, { data: store.audit });
    return send(res, 404, { success: false, error: "Not found" });
  } catch (error) {
    const status = error.statusCode ?? (error.code === "22P02" ? 400 : 500);
    console.error(JSON.stringify({ level: "error", path: url.pathname, status, message: error.message }));
    return send(res, status, { success: false, error: status >= 500 ? "Internal server error" : error.message });
  }
});

server.listen(port, host, () => console.log(`TFocus AI listening at http://${host}:${port}`));
process.once("SIGTERM", async () => { server.close(); await persistence.close(); });
process.once("SIGINT", async () => { server.close(); await persistence.close(); });
