// Genera las imágenes del sitio a partir de /imagenes/originales.
// - Todas las imágenes del sitio salen en WebP, en varios anchos (srcset).
// - Cada grupo va en su carpeta: marca, granja, cajillas, galeria, tamanos.
// - Las fotos pequeñas (capturas de video) se recortan las franjas rojas de
//   los bordes, se amplían al doble con un filtro de alta calidad (Lanczos) y
//   se les da un enfoque suave para que se vean nítidas.
// - También crea los íconos del navegador y la imagen para compartir en redes.
//
// Uso: npm run imagenes
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ORIGEN = 'imagenes/originales';
const DESTINO = 'imagenes';
const CALIDAD = 76;

// recorte: { left, top, width, height } sobre el original (opcional)
// ampliar: factor de ampliación antes de generar los anchos
const IMAGENES = [
  // Marca
  { carpeta: 'marca', origen: 'marca/logo-granja-habibi.webp', nombre: 'logo-granja-habibi', anchos: [200, 400, 800] },

  // Granja (capturas de video: se quitan bordes rojos y se amplían al doble)
  { carpeta: 'granja', origen: 'granja/pollito-bajo-calor.png', nombre: 'pollito-bajo-calor', recorte: { left: 14, top: 0, width: 437, height: 708 }, ampliar: 2, anchos: [480, 870] },
  { carpeta: 'granja', origen: 'granja/pollitos-en-crianza.png', nombre: 'pollitos-en-crianza', recorte: { left: 11, top: 0, width: 434, height: 685 }, ampliar: 2, anchos: [480, 860] },
  { carpeta: 'granja', origen: 'granja/entrega-de-cajillas.png', nombre: 'entrega-de-cajillas', recorte: { left: 2, top: 0, width: 435, height: 575 }, ampliar: 2, anchos: [480, 870] },
  { carpeta: 'granja', origen: 'granja/gallinas-en-galera.webp', nombre: 'gallinas-en-galera', ampliar: 2, anchos: [480, 860] },

  // Cajillas de 30
  { carpeta: 'cajillas', origen: 'cajillas/cajilla-rojos-xl.webp', nombre: 'cajilla-huevos-rojos-xl', anchos: [480, 800, 1200] },
  { carpeta: 'cajillas', origen: 'cajillas/cajilla-blancos-s.webp', nombre: 'cajilla-huevos-blancos-s', anchos: [480, 800, 1200] },
  { carpeta: 'cajillas', origen: 'cajillas/cajilla-rojos-m.webp', nombre: 'cajilla-huevos-rojos-m', anchos: [480, 800, 1200] },
  { carpeta: 'cajillas', origen: 'cajillas/cajilla-rojos-l.webp', nombre: 'cajilla-huevos-rojos-l', anchos: [480, 800, 1200] },

  // Galería "Arte en cáscara": acercamientos a huevos reales de las cajillas
  { carpeta: 'galeria', origen: 'cajillas/cajilla-rojos-m.webp', nombre: 'huevos-cascara-cafe', recorte: { left: 385, top: 530, width: 245, height: 294 }, ampliar: 2, anchos: [400, 490] },
  { carpeta: 'galeria', origen: 'cajillas/cajilla-blancos-s.webp', nombre: 'huevos-blancos-del-campo', recorte: { left: 990, top: 330, width: 290, height: 348 }, ampliar: 2, anchos: [400, 580] },
  { carpeta: 'galeria', origen: 'cajillas/cajilla-rojos-l.webp', nombre: 'huevos-recien-recolectados', recorte: { left: 1110, top: 340, width: 240, height: 288 }, ampliar: 2, anchos: [400, 480] },
  { carpeta: 'galeria', origen: 'cajillas/cajilla-rojos-xl.webp', nombre: 'huevos-cosecha-diaria', recorte: { left: 270, top: 925, width: 280, height: 336 }, ampliar: 2, anchos: [400, 560] },

  // Tamaños
  { carpeta: 'tamanos', origen: 'tamanos/huevos-segun-su-peso.webp', nombre: 'huevos-segun-su-peso', anchos: [480, 800, 1200], calidad: 68 },
];

async function preparar({ origen, recorte, ampliar = 1 }) {
  let img = sharp(path.join(ORIGEN, origen)).rotate();
  if (recorte) img = img.extract(recorte);
  const buffer = await img.toBuffer();
  if (ampliar > 1) {
    const { width } = await sharp(buffer).metadata();
    return sharp(buffer)
      .resize({ width: width * ampliar, kernel: 'lanczos3' })
      .sharpen({ sigma: 0.9, m1: 0.6, m2: 2.2 })
      .modulate({ saturation: 1.04 })
      .toBuffer();
  }
  return sharp(buffer).sharpen({ sigma: 0.6 }).toBuffer();
}

let total = 0;
for (const imagen of IMAGENES) {
  const carpeta = path.join(DESTINO, imagen.carpeta);
  await mkdir(carpeta, { recursive: true });
  const base = await preparar(imagen);
  for (const ancho of imagen.anchos) {
    const { data, info } = await sharp(base)
      .resize({ width: ancho, withoutEnlargement: true })
      .webp({ quality: imagen.calidad ?? CALIDAD, effort: 6, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    const archivo = path.join(carpeta, `${imagen.nombre}-${ancho}.webp`);
    await writeFile(archivo, data);
    total += data.length;
    console.log(`${archivo}: ${info.width}x${info.height} · ${(data.length / 1024).toFixed(0)} KB`);
  }
}

// Imagen para compartir el enlace en WhatsApp / Facebook (1200x630).
// Va en JPG porque WhatsApp y Facebook no siempre muestran WebP en la vista previa.
await mkdir(path.join(DESTINO, 'redes'), { recursive: true });
await sharp(path.join(ORIGEN, 'cajillas/cajilla-blancos-s.webp'))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(path.join(DESTINO, 'redes/compartir-granja-habibi.jpg'));

// Íconos del navegador a partir del logo
await mkdir(path.join(DESTINO, 'iconos'), { recursive: true });
const logo = path.join(ORIGEN, 'marca/logo-granja-habibi.webp');
const icono = (tam) => sharp(logo).resize(tam, tam).png({ compressionLevel: 9, palette: true });
await icono(32).toFile(path.join(DESTINO, 'iconos/favicon-32.png'));
await icono(192).toFile(path.join(DESTINO, 'iconos/icono-192.png'));
await icono(512).toFile(path.join(DESTINO, 'iconos/icono-512.png'));
await icono(180).toFile('apple-touch-icon.png');

// favicon.ico en la raíz (ICO que contiene un PNG de 48x48)
const png48 = await icono(48).toBuffer();
const cabecera = Buffer.alloc(22);
cabecera.writeUInt16LE(0, 0);
cabecera.writeUInt16LE(1, 2);
cabecera.writeUInt16LE(1, 4);
cabecera.writeUInt8(48, 6);
cabecera.writeUInt8(48, 7);
cabecera.writeUInt16LE(1, 10);
cabecera.writeUInt16LE(32, 12);
cabecera.writeUInt32LE(png48.length, 14);
cabecera.writeUInt32LE(22, 18);
await writeFile('favicon.ico', Buffer.concat([cabecera, png48]));

console.log(`\nTotal WebP: ${(total / 1024).toFixed(0)} KB (todas las variantes)`);
