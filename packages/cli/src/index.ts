#!/usr/bin/env node
import { Command } from 'commander';
import { configureCommand } from './commands/configure.js';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { onboardCommand } from './commands/onboard.js';
import { doctorCommand } from './commands/doctor.js';
import { statusCommand } from './commands/status.js';
import { auditCommand } from './commands/audit.js';
import { gatewayCommand } from './commands/gateway.js';

const program = new Command();

program
    .name('geminiclaw')
    .description('CLI to manage the GeminiClaw server and configuration')
    .version('0.1.0');

program.addCommand(configureCommand);
program.addCommand(startCommand);
program.addCommand(stopCommand);
program.addCommand(onboardCommand);
program.addCommand(doctorCommand);
program.addCommand(statusCommand);
program.addCommand(auditCommand);
program.addCommand(gatewayCommand);

// Fallback to help
if (process.argv.length === 2) {
    process.argv.push('-h');
}

program.parse(process.argv);
