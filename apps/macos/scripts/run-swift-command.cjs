#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node run-swift-command.cjs <swift-subcommand> [args...]');
  process.exit(1);
}

if (process.platform !== 'darwin') {
  console.log('[serenity-macos] Skipping Swift command on non-macOS platform.');
  process.exit(0);
}

const result = spawnSync('swift', args, {
  stdio: 'inherit',
  env: process.env,
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

if (result.error) {
  console.error(result.error.message);
}

process.exit(1);
