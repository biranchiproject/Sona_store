import { Pool } from "pg";
import "dotenv/config";

async function disableStorageRLS() {
    console.log("Disabling RLS on storage tables...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        // Attempt to disable RLS on Supabase storage tables
        // Note: This requires permissions on the storage schema
        await pool.query("ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;");
        await pool.query("ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;");
        console.log("Storage RLS disabled successfully.");
    } catch (e) {
        console.error("Error disabling Storage RLS:", e);
    } finally {
        await pool.end();
    }
}

disableStorageRLS();
