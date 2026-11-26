// Cambia el dominio del sitio en todos los archivos SEO de una sola vez.
// Uso: npm run dominio -- https://www.midominio.com.ni
import { readFile, writeFile } from 'node:fs/promises';

const ACTUAL = 'https://granjahabibi.com.ni';
const nuevo = (process.argv[2] || '').replace(/\/+$/, '');

if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(nuevo)) {
  console.error('Indicá el dominio completo con https, por ejemplo:\n  npm run dominio -- https://www.granjahabibi.com.ni');
  process.exit(1);
}

for (const archivo of ['index.html', 'robots.txt', 'sitemap.xml', 'scripts/cambiar-dominio.mjs', 'tests/sitio.test.mjs']) {
  const texto = await readFile(archivo, 'utf8');
  const cambiado = texto.split(ACTUAL).join(nuevo);
  if (cambiado !== texto) {
    await writeFile(archivo, cambiado);
    console.log(`✔ ${archivo}`);
  }
}
console.log(`\nDominio actualizado a ${nuevo}`);
