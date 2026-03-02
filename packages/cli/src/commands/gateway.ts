/**
 * @license Apache-2.0
 * GeminiClaw — Gateway Command
 */
import { Command } from 'commander';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { getRootDirSync } from '../utils/paths.js';

export const gatewayCommand = new Command('gateway')
    .description('Start the GeminiClaw Gateway directly')
    .option('-p, --port <number>', 'Port for the gateway server', '3000')
    .option('--allow-unconfigured', 'Allow start without configured agents', false)
    .action(async (options) => {
        const rootDir = getRootDirSync();
        const gatewayDir = path.join(rootDir, 'packages', 'gateway');

        console.log(`🚀 Starting GeminiClaw Gateway on port ${options.port}...`);

        // Find tsx or node
        const cmd = 'npx';
        const args = ['tsx', 'src/server.ts'];

        const gateway = spawn(cmd, args, {
            cwd: gatewayDir,
            stdio: 'inherit',
            env: {
                ...process.env,
                PORT: options.port,
                CONFIG_PATH: path.join(rootDir, 'config', 'geminiclaw.json'),
                ALLOW_UNCONFIGURED: options.allowUnconfigured ? 'true' : 'false'
            }
        });

        gateway.on('close', (code) => {
            if (code !== 0) {
                console.error(`[gateway] Process exited with code ${code}`);
            }
        });
    });
