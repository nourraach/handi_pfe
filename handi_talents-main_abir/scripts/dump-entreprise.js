const { db } = require("../dist/db");
const { entrepriseTable } = require("../dist/db/schema");

(async () => {
  const rows = await db.select().from(entrepriseTable);
  console.log(rows);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
