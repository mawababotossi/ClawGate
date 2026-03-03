/**
 * @license Apache-2.0
 * ClawGate — Robust Environment Loader
 */
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Searches upwards for the project root and loads the .env file.
 */
export function loadEnv(): void {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    let current = __dirname;
    let envPath: string | null = null;

    // Search up to 10 levels deep for the project root (containing packages/ or .env)
    for (let i = 0; i < 10; i++) {
        const potentialEnv = path.join(current, '.env');
        if (fs.existsSync(potentialEnv)) {
            envPath = potentialEnv;
            break;
        }

        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
    }

    if (envPath) {
        dotenv.config({ path: envPath });
        // Also set a global flag or log something?
    } else {
        // Fallback to default behavior if not found
        dotenv.config();
    }
}
