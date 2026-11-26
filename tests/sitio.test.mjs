// Pruebas del sitio: enlaces, imágenes, SEO y datos estructurados.
// Uso: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

const DOMINIO = 'https://granjahabibi.com.ni';
const html = readFileSync('index.html', 'utf8');
const html404 = readFileSync('404.html', 'utf8');

const todos = (re, texto = html) => [...texto.matchAll(re)].map((m) => m[1]);
const local = (ruta) => !/^(https?:|mailto:|tel:|data:|#)/.test(ruta);
const desdeSrcset = (s) => s.split(',').map((p) => p.trim().split(/\s+/)[0]);

test('todas las rutas locales (src, srcset, href) existen', () => {
  for (const [nombre, doc] of [['index.html', html], ['404.html', html404]]) {
    const rutas = [
      ...todos(/\s(?:src|href)="([^"]+)"/g, doc),
      ...todos(/\ssrcset="([^"]+)"/g, doc).flatMap(desdeSrcset),
    ].filter(local);
    for (const ruta of rutas) {
      const archivo = ruta.replace(/^\//, '') || 'index.html';
      assert.ok(existsSync(archivo), `${nombre}: no existe ${ruta}`);
    }
  }
});

test('se conserva el código original del sitio', () => {
  const originales = [
    'class="logo">🥚 HABIBÍ', 'id="heroBg"', 'HUEVOS HABIBÍ', 'Raíces que alimentan',
    'Huevos con personalidad', 'Arte en cáscara', 'Lo que dicen nuestros clientes',
    'Nuestro proceso artesanal', 'Encuéntranos', 'Tradición familiar desde 1975',
    '--verde-oliva: #283618', 'function handleTilt', 'bg-morph', 'font-awesome/6.0.0-beta3',
    'family=Inter', 'randomuser.me/api/portraits/women/68.jpg', 'photo-1506976785307-8732e854ad03',
  ];
  for (const texto of originales) assert.ok(html.includes(texto), `falta del original: ${texto}`);
});

test('los enlaces internos (#ancla) apuntan a ids existentes y no hay ids duplicados', () => {
  const ids = todos(/\sid="([^"]+)"/g);
  assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
  for (const ancla of todos(/\shref="#([^"]+)"/g)) assert.ok(ids.includes(ancla), `falta id="${ancla}"`);
});

test('las imágenes propias tienen alt y se cargan en diferido', () => {
  for (const img of html.match(/<img\b[^>]*src="imagenes\/[^>]*>/g)) {
    assert.match(img, /\salt="[^"]+"/, img);
    assert.match(img, /loading="lazy"/, img);
  }
});

test('SEO: título, descripción, canonical, Open Graph y un solo h1', () => {
  const titulo = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(titulo.length <= 75, `título de ${titulo.length} caracteres`);
  const desc = html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.ok(desc.length >= 120 && desc.length <= 240, `descripción de ${desc.length} caracteres`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${DOMINIO}/">`));
  assert.match(html, /property="og:image" content="https:\/\/[^"]+\.jpg"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

test('datos estructurados JSON-LD válidos y coherentes con la página', () => {
  const datos = JSON.parse(todos(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)[0]);
  const negocio = datos['@graph'].find((n) => n['@type'] === 'LocalBusiness');
  assert.equal(negocio.telephone, '+505 8703 5575');
  assert.equal(negocio.address.addressCountry, 'NI');
  const faq = datos['@graph'].find((n) => n['@type'] === 'FAQPage');
  assert.deepEqual(faq.mainEntity.map((q) => q.name), todos(/<summary>([^<]+)<\/summary>/g));
  for (const url of JSON.stringify(datos).match(/https:\/\/granjahabibi\.com\.ni\/imagenes\/[^"]+/g)) {
    assert.ok(existsSync(url.replace(`${DOMINIO}/`, '')), `JSON-LD apunta a ${url}`);
  }
});

test('robots.txt, sitemap.xml y manifest son correctos', () => {
  assert.match(readFileSync('robots.txt', 'utf8'), new RegExp(`Sitemap: ${DOMINIO}/sitemap.xml`));
  const sitemap = readFileSync('sitemap.xml', 'utf8');
  for (const img of todos(/<image:loc>([^<]+)<\/image:loc>/g, sitemap)) {
    assert.ok(existsSync(img.replace(`${DOMINIO}/`, '')), `sitemap apunta a ${img}`);
  }
  const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
  for (const icono of manifest.icons) assert.ok(existsSync(icono.src), `falta ${icono.src}`);
});

test('el WhatsApp usa el número correcto', () => {
  assert.match(html, /const WHATSAPP = '50587035575'/);
  for (const e of todos(/href="(https:\/\/wa\.me\/[^"?]+)/g)) assert.equal(e, 'https://wa.me/50587035575');
});

test('las imágenes optimizadas pesan poco', () => {
  for (const img of todos(/srcset="([^"]+)"/g).flatMap(desdeSrcset)) {
    assert.ok(statSync(img).size < 200 * 1024, `${img} pesa más de 200 KB`);
  }
  assert.ok(statSync('imagenes/compartir-granja-habibi.jpg').size < 300 * 1024);
});
