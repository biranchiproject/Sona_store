import { Pool } from "pg";
import "dotenv/config";

async function reset() {
    console.log("Dropping tables apps and reviews...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        await pool.query("DROP TABLE IF EXISTS reviews CASCADE;");
        await pool.query("DROP TABLE IF EXISTS apps CASCADE;");
        console.log("Tables dropped successfully.");
    } catch (e) {
        console.error("Error dropping tables:", e);
    } finally {
        await pool.end();
    }
}

reset();
