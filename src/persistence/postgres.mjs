import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";
import { config } from "../config.mjs";

const { Pool } = pg;

export class PostgresPersistence {
  constructor({ connectionString = config.databaseUrl } = {}) {
    this.pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
  }

  async migrate() {
    const migrationPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migrations/001_tfocus_core.sql");
    await this.pool.query(await fs.readFile(migrationPath, "utf8"));
  }

  async ping() {
    await this.pool.query("select 1");
    return true;
  }

  async close() {
    await this.pool.end();
  }

  async upsertConversation(conversation) {
    const result = await this.pool.query(`
      INSERT INTO tfocus_conversations (id, customer_id, state, mode, category_id, concept_code, quote_id, booking_hold_id, booking_id, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
      ON CONFLICT (id) DO UPDATE SET customer_id=EXCLUDED.customer_id, state=EXCLUDED.state, mode=EXCLUDED.mode,
        category_id=EXCLUDED.category_id, concept_code=EXCLUDED.concept_code, quote_id=EXCLUDED.quote_id,
        booking_hold_id=EXCLUDED.booking_hold_id, booking_id=EXCLUDED.booking_id, updated_at=now()
      RETURNING *`, [conversation.id, conversation.customerId, conversation.state, conversation.mode, conversation.categoryId,
      conversation.conceptCode, conversation.quoteId, conversation.bookingHoldId, conversation.bookingId]);
    return result.rows[0];
  }

  async audit(event) {
    await this.pool.query(`INSERT INTO tfocus_audit_events (event_type, conversation_id, entity_id, payload) VALUES ($1,$2,$3,$4)`,
      [event.type ?? "unknown", event.conversationId ?? null, event.entityId ?? null, event]);
  }
}
