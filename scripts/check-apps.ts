import "dotenv/config";
import { db } from "../server/db";
import { apps } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkApps() {
    try {
        const allApps = await db.select().from(apps);
        console.log("Found apps:", allApps.length);
        let found = false;
        allApps.forEach(app => {
            if (app.name === "Bingo") {
                found = true;
                console.log(`App: ${app.name} (${app.id})`);
                console.log(`- APK URL: ${app.apkUrl}`);
                console.log(`- PWA URL: ${app.pwaUrl}`);
                console.log(`- Category: ${app.category}`);
            }
        });
        if (!found) {
            console.log("App 'Bingo' not found.");
        }
    } catch (err) {
        console.error("Error fetching apps:", err);
    } finally {
        process.exit(0);
    }
}

checkApps();
