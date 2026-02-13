import { Pool } from "pg";
import "dotenv/config";

async function setupStorage() {
    console.log("Setting up storage buckets and policies...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        // 1. Create Buckets
        console.log("Creating buckets...");
        await pool.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('app-assets', 'app-assets', true) 
      ON CONFLICT (id) DO NOTHING;
    `);
        await pool.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('apk-files', 'apk-files', true) 
      ON CONFLICT (id) DO NOTHING;
    `);

        // 2. Create Policies
        // Note: We use execute anonymous code block or just direct queries.
        // We need to drop existing policies to avoid conflicts or ignore errors.
        console.log("Creating policies...");

        // Policy for SELECT (Public read)
        try {
            await pool.query(`
        CREATE POLICY "Public Read Access" 
        ON storage.objects FOR SELECT 
        USING ( bucket_id IN ( 'app-assets', 'apk-files' ) );
      `);
        } catch (e: any) {
            console.log("Policy 'Public Read Access' might already exist or error:", e.message);
        }

        // Policy for INSERT (Public upload for now, or authenticated)
        try {
            await pool.query(`
        CREATE POLICY "Public Insert Access" 
        ON storage.objects FOR INSERT 
        WITH CHECK ( bucket_id IN ( 'app-assets', 'apk-files' ) );
      `);
        } catch (e: any) {
            console.log("Policy 'Public Insert Access' might already exist or error:", e.message);
        }

        // Policy for UPDATE
        try {
            await pool.query(`
        CREATE POLICY "Public Update Access" 
        ON storage.objects FOR UPDATE
        USING ( bucket_id IN ( 'app-assets', 'apk-files' ) );
      `);
        } catch (e: any) {
            console.log("Policy 'Public Update Access' might already exist or error:", e.message);
        }


        console.log("Storage setup complete.");
    } catch (e) {
        console.error("Error setting up storage:", e);
    } finally {
        await pool.end();
    }
}

setupStorage();
