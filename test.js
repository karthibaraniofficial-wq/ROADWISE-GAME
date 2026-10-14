import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

function getEsbuildPath() {
  const platform = process.platform;
  const arch = process.arch;
  const candidates = [
    path.resolve(`node_modules/@esbuild/${platform}-${arch}/esbuild${platform === 'win32' ? '.exe' : ''}`),
    path.resolve(`node_modules/@esbuild/${platform}-${arch}/bin/esbuild`),
    path.resolve('node_modules/@esbuild/win32-x64/esbuild.exe'),
    path.resolve(`node_modules/.bin/esbuild${platform === 'win32' ? '.cmd' : ''}`),
    path.resolve('node_modules/.bin/esbuild'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'esbuild';
}

const esbuildPath = getEsbuildPath();

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
