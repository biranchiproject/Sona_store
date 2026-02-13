import { Pool } from "pg";
import "dotenv/config";

async function disableRLS() {
    console.log("Disabling RLS on all tables...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        await pool.query("ALTER TABLE users DISABLE ROW LEVEL SECURITY;");
        await pool.query("ALTER TABLE apps DISABLE ROW LEVEL SECURITY;");
        await pool.query("ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;");
        console.log("RLS disabled successfully.");
    } catch (e) {
        console.error("Error disabling RLS:", e);
    } finally {
        await pool.end();
    }
}

disableRLS();
