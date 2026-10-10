import crypto from "node:crypto";
import { config } from "./config.mjs";

export function authorize(req) {
  if (config.nodeEnv === "development" && process.env.TFOCUS_REQUIRE_AUTH !== "true") return true;
  const value = req.headers.authorization ?? "";
  const token = value.startsWith("Bearer ") ? value.slice(7) : "";
  const expected = Buffer.from(config.serviceToken);
  const provided = Buffer.from(token);
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

export function assertAuthorized(req) {
  if (!authorize(req)) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
}
