import { PostgresPersistence } from "./postgres.mjs";

const persistence = new PostgresPersistence();
try {
  await persistence.migrate();
  console.log("TFocus migrations applied successfully");
} finally {
  await persistence.close();
}
