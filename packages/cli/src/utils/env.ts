import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Updates or creates the .env file with the provided variables.
 * Does not overwrite existing non-GeminiClaw variables if possible.
 */
export async function overwriteEnvVariables(newVars: Record<string, string>) {
    const envPath = path.resolve(process.cwd(), '../../.env');

    let content = '';
    try {
        content = await fs.readFile(envPath, 'utf8');
    } catch (err: any) {
        if (err.code !== 'ENOENT') throw err;
    }

    const lines = content.split('\n');
    const seen = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;

        const [key] = line.split('=');
        if (newVars[key] !== undefined) {
            lines[i] = `${key}=${newVars[key]}`;
            seen.add(key);
        }
    }

    // Add new variables that weren't in the file
    for (const key of Object.keys(newVars)) {
        if (!seen.has(key)) {
            lines.push(`${key}=${newVars[key]}`);
        }
    }

    await fs.writeFile(envPath, lines.join('\n').trim() + '\n', 'utf8');
}
