import fs from "fs";
import path from "path";
import { pool } from ".";

async function run() {
  const sqlDir = path.join(__dirname, "..", "..", "sql");
  const files = fs
    .readdirSync(sqlDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(sqlDir, file), "utf8");
    await pool.query(sql);
    console.log(`[reporting-service] applied migration ${file}`);
  }

  await pool.end();
}

run().catch(async (error) => {
  console.error("[reporting-service] migration failed", error);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
