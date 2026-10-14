import { execFileSync } from 'node:child_process';
import path from 'node:path';

const esbuildPath = path.resolve('node_modules/@esbuild/win32-x64/esbuild.exe');

console.log('Compiling test suite with esbuild...');
execFileSync(esbuildPath, [
  'tests/run_tests.mjs',
  '--bundle',
  '--platform=node',
  '--format=esm',
  '--outfile=tests/bundle.test.mjs',
  '--loader:.ts=ts',
  '--external:node:test',
  '--external:node:assert/strict',
  '--external:firebase',
  '--external:firebase/*',
], { stdio: 'inherit' });

console.log('Running test suite via Node.js native test runner...\n');
execFileSync(process.execPath, ['--test', 'tests/bundle.test.mjs'], { stdio: 'inherit' });
