// Servidor local para probar el sitio (sin dependencias).
// Imita los encabezados de producción del .htaccess (incluida la CSP)
// para detectar errores antes de subir al hosting.
// Uso: npm start   (http://localhost:8080)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.env.PORT) || 8080;
const BLOQUEADOS = /^\/(src-images|scripts|tests|node_modules|\.git)(\/|$)|^\/(package(-lock)?\.json|README\.md)$/;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; frame-src https://www.google.com https://maps.google.com; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'self'";

const servidor = createServer(async (req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const cabeceras = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': CSP,
  };

  let archivo = path.normalize(path.join(RAIZ, ruta === '/' ? 'index.html' : ruta));
  let codigo = 200;
  try {
    if (!archivo.startsWith(RAIZ) || BLOQUEADOS.test(ruta)) throw new Error('prohibido');
    if ((await stat(archivo)).isDirectory()) archivo = path.join(archivo, 'index.html');
    await stat(archivo);
  } catch {
    archivo = path.join(RAIZ, '404.html');
    codigo = 404;
  }

  const cuerpo = await readFile(archivo);
  res.writeHead(codigo, { ...cabeceras, 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
  res.end(cuerpo);
  console.log(codigo, req.method, ruta);
});

servidor.listen(PUERTO, () => console.log(`Granja Habibi en http://localhost:${PUERTO}`));
