/**
 * @license Apache-2.0
 * GeminiClaw — Status Command
 */
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export const statusCommand = new Command('status')
    .description('Monitor running GeminiClaw processes')
    .option('--all', 'Show detailed process and socket info')
    .action(async (opts) => {
        console.log('📊 GeminiClaw Status\n');

        const services = [
            { name: 'Gateway', dir: 'packages/gateway', pid: 'gateway.pid' },
            { name: 'Dashboard', dir: 'packages/dashboard', pid: 'dashboard.pid' },
        ];

        const rootDir = path.resolve(process.cwd(), '../../');

        for (const svc of services) {
            const pidPath = path.join(rootDir, svc.dir, svc.pid);
            let status = '🔘 Stopped';
            let info = '';

            if (fs.existsSync(pidPath)) {
                const pid = fs.readFileSync(pidPath, 'utf8').trim();
                try {
                    // Check if process is alive
                    process.kill(parseInt(pid), 0);
                    status = '🟢 Running';
                    info = `(PID: ${pid})`;
                } catch {
                    status = '🔴 Dead (Zombie PID)';
                }
            }

            console.log(`${svc.name.padEnd(12)}: ${status} ${info}`);

            if (opts.all && status === '🟢 Running') {
                // Try to get port info if on Linux
                try {
                    const netstat = execSync(`ss -lptn | grep ${svc.name === 'Gateway' ? '3000' : '5173'}`).toString();
                    console.log(`   🔗 Socket: ${netstat.trim()}`);
                } catch {
                    // Ignore if grep fails
                }
            }
        }
    });
