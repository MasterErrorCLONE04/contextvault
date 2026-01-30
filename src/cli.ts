#!/usr/bin/env node
import { ContextVaultServer } from './server.js';
import { AutoDetector } from './core/autodetect.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'hook':
            await runHook();
            break;

        case 'install-hooks':
            await installHooks();
            break;

        default:
            // Default behavior: Run the MCP Server
            const server = new ContextVaultServer();
            await server.run();
            break;
    }
}

async function runHook() {
    try {
        // Get staged changes
        const { stdout } = await execAsync('git diff --cached --unified=0 --no-color');

        if (!stdout.trim()) {
            return; // No changes or empty
        }

        // Simple heuristic: extract added lines only
        const addedLines = stdout
            .split('\n')
            .filter(line => line.startsWith('+') && !line.startsWith('+++'))
            .map(line => line.substring(1))
            .join('\n');

        if (addedLines.length < 10) return;

        const suggestions = AutoDetector.detect(addedLines);

        if (suggestions.length > 0) {
            console.error('\n\x1b[33m\x1b[1m💡 ContextVault detected potential memories in your changes:\x1b[0m');

            suggestions.forEach((s) => {
                console.error(`\n   \x1b[36m[${s.category.toUpperCase()}]\x1b[0m ${s.suggestedValue}`);
                console.error(`   \x1b[90mKey suggestion: ${s.suggestedKey}\x1b[0m`);
            });

            console.error('\n\x1b[32mTip: Ask your AI agent to "save these decisions" to persist them.\x1b[0m\n');
        }

    } catch (error) {
        // Silently fail in hooks to not block commit flow unless critical (logging to debug)
        // console.error('ContextVault Hook Error:', error);
    }
}

async function installHooks() {
    const hookDir = path.join(process.cwd(), '.git', 'hooks');
    const preCommitPath = path.join(hookDir, 'pre-commit');

    if (!fs.existsSync(hookDir)) {
        console.error('❌ .git/hooks directory not found. Are you in a git root?');
        process.exit(1);
    }

    // Windows-friendly hook script (assuming git bash or similar environment usually runs hooks)
    // For Windows/Powershell specifically, direct execution might depend on environment.
    // We'll write a shell script standard for git hooks.
    const hookScript = `#!/bin/sh
# ContextVault Hook
if command -v contextvault >/dev/null 2>&1; then
  contextvault hook
elif [ -f "./dist/src/cli.js" ]; then
  node ./dist/src/cli.js hook
fi
`;

    try {
        fs.writeFileSync(preCommitPath, hookScript, { mode: 0o755 });
        console.log('✅ Git hook installed to .git/hooks/pre-commit');
    } catch (err) {
        console.error('❌ Failed to install hook:', err);
    }
}

main().catch(console.error);
