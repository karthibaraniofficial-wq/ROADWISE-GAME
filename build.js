import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

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

console.log('Building ROADWISE...');
fs.mkdirSync('dist', { recursive: true });

function getEnvDefines() {
  const defines = ['--define:process.env.NODE_ENV="production"'];
  if (fs.existsSync('.env')) {
    const envLines = fs.readFileSync('.env', 'utf-8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        defines.push(`--define:import.meta.env.${key}=${JSON.stringify(val)}`);
        defines.push(`--define:process.env.${key}=${JSON.stringify(val)}`);
      }
    }
  }
  return defines;
}

try {
  execFileSync(esbuildPath, [
    'src/main.tsx',
    '--bundle',
    '--outfile=dist/bundle.js',
    '--format=esm',
    '--loader:.tsx=tsx',
    '--loader:.ts=ts',
    '--loader:.png=dataurl',
    '--loader:.jpg=dataurl',
    '--loader:.svg=dataurl',
    '--loader:.css=css',
    '--minify',
    '--sourcemap',
    ...getEnvDefines(),
  ], { stdio: 'inherit' });

  let html = fs.readFileSync('index.html', 'utf-8');
  html = html.replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="/bundle.js"></script>');
  fs.writeFileSync('dist/index.html', html);

  console.log('Build completed successfully in dist/');
} catch (err) {
  console.error('Build error:', err.message);
  process.exit(1);
}
