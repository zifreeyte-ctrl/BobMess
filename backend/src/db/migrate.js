import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = await fs.readFile(schemaPath, "utf-8");

  await pool.query(schema);

  console.log("BobMess database migrated successfully.");

  await pool.end();
}

migrate().catch(async (error) => {
  console.error("Migration failed:", error);

  await pool.end();

  process.exit(1);
});