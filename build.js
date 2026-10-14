import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const esbuildPath = path.resolve('node_modules/@esbuild/win32-x64/esbuild.exe');

console.log('Building ROADWISE...');
fs.mkdirSync('dist', { recursive: true });

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
    '--define:process.env.NODE_ENV="production"',
  ], { stdio: 'inherit' });

  let html = fs.readFileSync('index.html', 'utf-8');
  html = html.replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="/bundle.js"></script>');
  fs.writeFileSync('dist/index.html', html);

  console.log('Build completed successfully in dist/');
} catch (err) {
  console.error('Build error:', err.message);
  process.exit(1);
}
