/**
 * @license Apache-2.0
 * GeminiClaw — Audit Command
 */
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';

export const auditCommand = new Command('audit')
    .description('Audit logs for potential issues and anomalies')
    .option('--limit <n>', 'Limit of lines to scan per file', '500')
    .action(async (opts) => {
        console.log('🕵️  GeminiClaw Audit — Log Scanning\n');

        const logFiles = [
            'packages/gateway/gateway.log',
            'packages/dashboard/dashboard.log',
        ];

        const rootDir = path.resolve(process.cwd(), '../../');
        const limit = parseInt(opts.limit);

        for (const logRel of logFiles) {
            const logPath = path.join(rootDir, logRel);
            console.log(`📄 Auditing ${logRel}...`);

            if (!fs.existsSync(logPath)) {
                console.log('   ⚠️  File not found. Skip.');
                continue;
            }

            const content = fs.readFileSync(logPath, 'utf8');
            const lines = content.split('\n').reverse().slice(0, limit);

            const patterns = [
                { regex: /error/i, label: '🚨 Error detected' },
                { regex: /timeout/i, label: '⏱️  Timeout detected' },
                { regex: /429|rate limit/i, label: '🛑 Rate limit (429) hit' },
                { regex: /Bad MAC|desync/i, label: '🔑 WA Session Desync' },
                { regex: /unauthorized|invalid token/i, label: '🛡️  Auth Failure' },
            ];

            const findings = new Map<string, number>();

            for (const line of lines) {
                for (const p of patterns) {
                    if (p.regex.test(line)) {
                        findings.set(p.label, (findings.get(p.label) || 0) + 1);
                    }
                }
            }

            if (findings.size === 0) {
                console.log('   ✅ No critical anomalies found in recent lines.');
            } else {
                for (const [label, count] of findings) {
                    console.log(`   ${label}: ${count} occurrence(s)`);
                }
            }
            console.log('');
        }

        console.log('✅ Audit complete.');
    });
