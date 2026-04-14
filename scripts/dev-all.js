#!/usr/bin/env node
const { spawn } = require('child_process');
const readline = require('readline');

function run(name, cmd, args, options = {}) {
  const child = spawn(cmd, args, { shell: process.platform === 'win32', env: process.env, ...options });

  const prefix = `[${name}]`;
  const rlOut = readline.createInterface({ input: child.stdout });
  rlOut.on('line', (line) => console.log(`${prefix} ${line}`));

  const rlErr = readline.createInterface({ input: child.stderr });
  rlErr.on('line', (line) => console.error(`${prefix} ${line}`));

  child.on('exit', (code, signal) => {
    console.log(`${prefix} exited ${signal ? `with signal ${signal}` : `with code ${code}`}`);
  });

  return child;
}

const procs = [];
function startAll() {
  procs.push(run('backend', 'npm', ['run', 'dev', '-w', 'apps/backend']));
  procs.push(run('frontend', 'npm', ['run', 'dev', '-w', 'apps/frontend']));

  const stopAll = (sig = 'SIGINT') => {
    for (const p of procs) {
      if (!p.killed) {
        try { p.kill(sig); } catch {}
      }
    }
  };

  process.on('SIGINT', () => { stopAll('SIGINT'); process.exit(130); });
  process.on('SIGTERM', () => { stopAll('SIGTERM'); process.exit(143); });
}

startAll();

