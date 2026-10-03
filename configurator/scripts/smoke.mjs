import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const executable = resolve(process.argv[2] || 'release/win-unpacked/TOXIQ Configurator.exe');
const child = spawn(executable, ['--smoke-test'], { stdio: 'inherit' });
const timeout = setTimeout(() => { child.kill(); process.exitCode = 1; }, 30000);
child.on('error', error => { clearTimeout(timeout); console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { clearTimeout(timeout); process.exitCode = code === 0 ? 0 : 1; });
