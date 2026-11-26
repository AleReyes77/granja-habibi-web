// Pruebas estáticas del sitio: enlaces, imágenes, SEO y datos estructurados.
// Uso: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

const DOMINIO = 'https://granjahabibi.com.ni';
const html = readFileSync('index.html', 'utf8');
const html404 = readFileSync('404.html', 'utf8');

const todos = (re, texto = html) => [...texto.matchAll(re)].map((m) => m[1]);
const sinEtiquetas = (t) => t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const local = (ruta) => !/^(https?:|mailto:|tel:|data:|#)/.test(ruta);

test('todas las rutas locales (src, srcset, href) existen', () => {
  for (const [nombre, doc] of [['index.html', html], ['404.html', html404]]) {
    const rutas = [
      ...todos(/\s(?:src|href|data-ampliar)="([^"]+)"/g, doc),
      ...todos(/\s(?:srcset|imagesrcset)="([^"]+)"/g, doc).flatMap((s) => s.split(',').map((p) => p.trim().split(/\s+/)[0])),
    ].filter(local);
    assert.ok(rutas.length > 0);
    for (const ruta of rutas) {
      const archivo = ruta.replace(/^\//, '') || 'index.html';
      assert.ok(existsSync(archivo), `${nombre}: no existe ${ruta}`);
    }
  }
});

test('los enlaces internos (#ancla) apuntan a ids existentes', () => {
  const ids = new Set(todos(/\sid="([^"]+)"/g));
  for (const ancla of todos(/\shref="#([^"]+)"/g)) {
    assert.ok(ids.has(ancla), `falta id="${ancla}"`);
  }
  for (const uso of todos(/<use href="#([^"]+)"/g)) {
    assert.ok(ids.has(uso), `ícono inexistente #${uso}`);
  }
});

test('no hay ids duplicados', () => {
  const ids = todos(/\sid="([^"]+)"/g);
  const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(repetidos, []);
});

test('cada imagen tiene alt, width y height (evita saltos de diseño)', () => {
  for (const img of html.match(/<img\b[^>]*>/g)) {
    assert.match(img, /\salt="/, `sin alt: ${img}`);
    if (!img.includes('id="visorImg"')) {
      assert.match(img, /\swidth="\d+"/, `sin width: ${img}`);
      assert.match(img, /\sheight="\d+"/, `sin height: ${img}`);
    }
  }
});

test('las imágenes debajo del primer pantallazo se cargan en diferido', () => {
  const imgs = html.match(/<img\b[^>]*>/g).filter((i) => !i.includes('id="visorImg"'));
  const diferidas = imgs.filter((i) => i.includes('loading="lazy"'));
  assert.ok(diferidas.length >= 4, 'se esperaban imágenes con loading="lazy"');
  const hero = imgs.find((i) => i.includes('fetchpriority="high"'));
  assert.ok(hero && !hero.includes('loading="lazy"'), 'la imagen principal no debe ser lazy');
});

test('SEO básico: título, descripción, canonical, un solo h1, idioma', () => {
  const titulo = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(titulo.length >= 30 && titulo.length <= 75, `título de ${titulo.length} caracteres`);
  const desc = html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.ok(desc.length >= 120 && desc.length <= 230, `descripción de ${desc.length} caracteres`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${DOMINIO}/">`));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<html lang="es-NI">/);
  assert.match(html, /property="og:image" content="https:\/\/[^"]+\.jpg"/);
});

test('la jerarquía de títulos no salta niveles', () => {
  const niveles = todos(/<h([1-6])\b/g).map(Number);
  for (let i = 1; i < niveles.length; i++) {
    assert.ok(niveles[i] - niveles[i - 1] <= 1, `salto de h${niveles[i - 1]} a h${niveles[i]}`);
  }
});

test('los datos estructurados JSON-LD son válidos y coherentes', () => {
  const bloques = todos(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  assert.equal(bloques.length, 1);
  const datos = JSON.parse(bloques[0]);
  const grafo = datos['@graph'];
  const negocio = grafo.find((n) => n['@type'] === 'LocalBusiness');
  assert.ok(negocio, 'falta LocalBusiness');
  assert.equal(negocio.telephone, '+505 8703 5575');
  assert.equal(negocio.address.addressCountry, 'NI');
  assert.ok(negocio.geo.latitude && negocio.geo.longitude);

  // Las preguntas del FAQ en JSON-LD deben coincidir con las visibles en la página
  const faq = grafo.find((n) => n['@type'] === 'FAQPage');
  const preguntasLd = faq.mainEntity.map((q) => q.name);
  const preguntasHtml = todos(/<summary>([\s\S]*?)<\/summary>/g).map(sinEtiquetas);
  assert.deepEqual(preguntasLd, preguntasHtml);

  // Las URLs absolutas de imágenes en JSON-LD deben existir localmente
  for (const url of JSON.stringify(datos).match(/https:\/\/granjahabibi\.com\.ni\/img\/[^"]+/g)) {
    assert.ok(existsSync(url.replace(`${DOMINIO}/`, '')), `JSON-LD apunta a imagen inexistente: ${url}`);
  }
});

test('robots.txt, sitemap.xml y manifest son correctos', () => {
  assert.match(readFileSync('robots.txt', 'utf8'), new RegExp(`Sitemap: ${DOMINIO}/sitemap.xml`));
  const sitemap = readFileSync('sitemap.xml', 'utf8');
  assert.match(sitemap, new RegExp(`<loc>${DOMINIO}/</loc>`));
  for (const img of todos(/<image:loc>([^<]+)<\/image:loc>/g, sitemap)) {
    assert.ok(existsSync(img.replace(`${DOMINIO}/`, '')), `sitemap apunta a ${img}`);
  }
  const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
  for (const icono of manifest.icons) assert.ok(existsSync(icono.src), `falta ${icono.src}`);
});

test('compatible con la Content-Security-Policy (sin scripts ni estilos en línea)', () => {
  const scripts = html.match(/<script\b[^>]*>/g);
  for (const s of scripts) {
    assert.ok(s.includes('src=') || s.includes('application/ld+json'), `script en línea: ${s}`);
  }
  assert.doesNotMatch(html, /\sstyle="/, 'hay atributos style en línea');
  assert.doesNotMatch(html, /\son[a-z]+="/, 'hay manejadores de eventos en línea');
});

test('los enlaces externos que abren pestaña nueva usan rel="noopener"', () => {
  for (const a of html.match(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(a, /rel="noopener/, a);
  }
});

test('los enlaces de WhatsApp usan el número correcto', () => {
  const enlaces = todos(/href="(https:\/\/wa\.me\/[^"?]+)/g);
  assert.ok(enlaces.length >= 3);
  for (const e of enlaces) assert.equal(e, 'https://wa.me/50587035575');
  assert.match(readFileSync('js/main.js', 'utf8'), /const WHATSAPP = '50587035575'/);
});

test('peso de la página: imágenes optimizadas y archivos livianos', () => {
  for (const archivo of ['css/estilos.css', 'js/main.js']) {
    assert.ok(statSync(archivo).size < 40 * 1024, `${archivo} pesa demasiado`);
  }
  for (const img of todos(/srcset="([^"]+)"/g).flatMap((s) => s.split(',').map((p) => p.trim().split(/\s+/)[0]))) {
    assert.ok(statSync(img).size < 200 * 1024, `${img} pesa más de 200 KB`);
  }
  assert.ok(statSync('img/og-granja-habibi.jpg').size < 300 * 1024, 'la imagen para WhatsApp debe pesar menos de 300 KB');
});
