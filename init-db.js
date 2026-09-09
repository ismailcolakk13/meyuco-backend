const fs = require("fs");
const path = require("path");
const db = require("./db");

async function initDatabase() {
  const sqlPath = path.join(__dirname, "init.sql");
  console.log(`[DB INIT] Reading SQL script from ${sqlPath}...`);

  try {
    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log("[DB INIT] Executing SQL script...");
    await db.query(sql);
    console.log("✅ [DB INIT] Database initialized successfully with tables, seed users, and events!");
    process.exit(0);
  } catch (error) {
    console.error("❌ [DB INIT] Failed to initialize database:", error);
    process.exit(1);
  }
}

initDatabase();

