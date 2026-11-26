// Genera versiones optimizadas (AVIF + WebP en varios tamaños) de las imágenes
// originales en /src-images y las deja en /img. También crea favicons y la
// imagen para redes sociales (Open Graph).
//
// Uso: npm run imagenes
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ORIGEN = 'src-images';
const DESTINO = 'img';

// nombre del archivo original -> anchos a generar
const IMAGENES = {
  'caja-huevos-blancos': [480, 800, 1200],
  'caja-huevos-rojos': [480, 800, 1200],
  'tamanos-huevos': [480, 800, 1200],
  logo: [160, 320, 640],
};

await mkdir(DESTINO, { recursive: true });

// Quita el fondo blanco del logo con un relleno por inundación desde los bordes:
// solo se vuelve transparente el blanco conectado al exterior, así se conservan
// los blancos internos (la gallina, los huevos).
async function logoTransparente() {
  const { data, info } = await sharp(path.join(ORIGEN, 'logo.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const claro = (i) => data[i] > 228 && data[i + 1] > 228 && data[i + 2] > 228;
  const visto = new Uint8Array(w * h);
  const pila = [];
  for (let x = 0; x < w; x++) pila.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) pila.push(y * w, y * w + w - 1);
  while (pila.length) {
    const p = pila.pop();
    if (visto[p]) continue;
    visto[p] = 1;
    if (!claro(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % w;
    if (x > 0) pila.push(p - 1);
    if (x < w - 1) pila.push(p + 1);
    if (p >= w) pila.push(p - w);
    if (p < w * (h - 1)) pila.push(p + w);
  }
  // Suaviza el borde: los píxeles casi blancos junto al fondo quedan semitransparentes
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue;
    const vecinoTransparente = [p - 1, p + 1, p - w, p + w].some((q) => q >= 0 && q < w * h && data[q * 4 + 3] === 0);
    if (vecinoTransparente) {
      const brillo = Math.min(data[i], data[i + 1], data[i + 2]);
      data[i + 3] = Math.max(0, Math.min(255, Math.round((255 - brillo) * 3.5)));
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim().png().toBuffer();
}
const logoSinFondo = await logoTransparente();
const fuente = (nombre) => (nombre === 'logo' ? logoSinFondo : path.join(ORIGEN, `${nombre}.webp`));

let total = 0;
for (const [nombre, anchos] of Object.entries(IMAGENES)) {
  const entrada = fuente(nombre);
  for (const ancho of anchos) {
    const base = sharp(entrada).resize({ width: ancho, withoutEnlargement: true });
    const avif = await base.clone().avif({ quality: nombre === 'logo' ? 60 : 50, effort: 6 }).toBuffer();
    const webp = await base.clone().webp({ quality: 75, alphaQuality: 90, effort: 6 }).toBuffer();
    await writeFile(path.join(DESTINO, `${nombre}-${ancho}.avif`), avif);
    await writeFile(path.join(DESTINO, `${nombre}-${ancho}.webp`), webp);
    total += avif.length + webp.length;
    console.log(`${nombre}-${ancho}: avif ${(avif.length / 1024).toFixed(0)} KB · webp ${(webp.length / 1024).toFixed(0)} KB`);
  }
}

// Imagen para compartir en WhatsApp / Facebook (1200x630, JPG para máxima compatibilidad)
await sharp(path.join(ORIGEN, 'caja-huevos-rojos.webp'))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 78, mozjpeg: true })
  .toFile(path.join(DESTINO, 'og-granja-habibi.jpg'));

// Íconos (el logo tiene fondo blanco, se recorta un poco el margen)
const logo = path.join(ORIGEN, 'logo.webp');
const icono = (tam) => sharp(logo).resize(tam, tam, { fit: 'contain', background: '#ffffff' }).png({ compressionLevel: 9, palette: true });
await icono(32).toFile(path.join(DESTINO, 'favicon-32.png'));
await icono(180).toFile('apple-touch-icon.png');
await icono(192).toFile(path.join(DESTINO, 'icon-192.png'));
await icono(512).toFile(path.join(DESTINO, 'icon-512.png'));

// favicon.ico en la raíz (ICO que contiene un PNG de 48x48)
const png48 = await icono(48).toBuffer();
const cabecera = Buffer.alloc(22);
cabecera.writeUInt16LE(0, 0); // reservado
cabecera.writeUInt16LE(1, 2); // tipo: icono
cabecera.writeUInt16LE(1, 4); // número de imágenes
cabecera.writeUInt8(48, 6); // ancho
cabecera.writeUInt8(48, 7); // alto
cabecera.writeUInt8(0, 8); // paleta
cabecera.writeUInt8(0, 9); // reservado
cabecera.writeUInt16LE(1, 10); // planos
cabecera.writeUInt16LE(32, 12); // bits por píxel
cabecera.writeUInt32LE(png48.length, 14); // tamaño de los datos
cabecera.writeUInt32LE(22, 18); // desplazamiento
await writeFile('favicon.ico', Buffer.concat([cabecera, png48]));

console.log(`\nTotal imágenes responsivas: ${(total / 1024).toFixed(0)} KB (todas las variantes)`);
