import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const esbuildPath = path.resolve('node_modules/@esbuild/win32-x64/esbuild.exe');
const PORT = 5173;

function build() {
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
      '--sourcemap',
      '--define:process.env.NODE_ENV="development"',
    ]);
  } catch (err) {
    console.error('Build failure:', err.message);
  }
}

// Initial build
build();

// Watch src folder for changes
let debounceTimer = null;
fs.watch('src', { recursive: true }, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log('[ROADWISE DEV] Recompiling...');
    build();
  }, 100);
});

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/') reqUrl = '/index.html';

  let filePath = path.join(process.cwd(), reqUrl);
  if (reqUrl.startsWith('/bundle.')) {
    filePath = path.join(process.cwd(), 'dist', reqUrl);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback: return index.html
    const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
    const modifiedHtml = indexHtml.replace('/src/main.tsx', '/bundle.js');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(modifiedHtml);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🚀 ROADWISE Dev Server running at: http://localhost:${PORT}/\n`);
});
