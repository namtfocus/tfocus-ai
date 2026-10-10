import { PostgresPersistence } from "./persistence/postgres.mjs";

const intervalMs = Number(process.env.TFOCUS_WORKER_INTERVAL_MS ?? 30_000);
const persistence = new PostgresPersistence();

async function tick() {
  try {
    await persistence.pool.query(`UPDATE tfocus_booking_holds SET status='EXPIRED' WHERE status='HELD' AND expires_at <= now()`);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "worker_tick_failed", error: error.message }));
  }
}

await persistence.migrate();
await tick();
console.log(`TFocus worker started; interval=${intervalMs}ms`);
const timer = setInterval(() => void tick(), intervalMs);
process.once("SIGTERM", async () => { clearInterval(timer); await persistence.close(); process.exit(0); });
process.once("SIGINT", async () => { clearInterval(timer); await persistence.close(); process.exit(0); });
