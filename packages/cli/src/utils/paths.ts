/**
 * @license Apache-2.0
 * ClawGate — CLI Path Utilities
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Returns the absolute path to the ClawGate root directory.
 * Derived from the location of the CLI source/dist files.
 */
export function getRootDir(): string {
    const dirname = path.dirname(fileURLToPath(import.meta.url));

    // If we are in src/utils/ or dist/utils/, root is 3 levels up
    // packages/cli/src/utils/paths.ts -> ../../../.. -> root
    // But since index.ts imports from commands/, which imports from utils/,
    // we should be careful about the nesting.

    // Let's use a more robust check: look for 'packages' and 'config'
    let current = dirname;
    while (current !== '/' && current !== path.parse(current).root) {
        if (path.basename(current) === '.clawgate') return current; // For global install
        if (requireExists(path.join(current, 'packages')) && requireExists(path.join(current, 'config'))) {
            return current;
        }
        current = path.dirname(current);
    }

    return process.cwd(); // Fallback
}

function requireExists(p: string): boolean {
    try {
        import('node:fs').then(fs => fs.existsSync(p));
        return true;
    } catch {
        return false;
    }
}

// Re-implementing with synchronous fs since it's cleaner for a CLI utility
import fs from 'node:fs';

export function getRootDirSync(): string {
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    let current = dirname;

    for (let i = 0; i < 10; i++) { // Max depth for safety
        if (fs.existsSync(path.join(current, 'package.json')) &&
            fs.existsSync(path.join(current, 'packages')) &&
            fs.existsSync(path.join(current, 'config'))) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
    }

    // Final fallback: check for .clawgate in home
    const homeGClaw = path.join(process.env['HOME'] || '', '.clawgate');
    if (fs.existsSync(homeGClaw)) return homeGClaw;

    return process.cwd();
}
