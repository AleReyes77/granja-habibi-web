// Comprime las imágenes originales de /imagenes/originales y genera versiones
// livianas (AVIF + WebP en varios tamaños) en /imagenes. No se recorta ni se
// retoca ninguna imagen: solo se reduce el peso y el tamaño en píxeles.
// También crea los favicons y la imagen para compartir en redes.
//
// Uso: npm run imagenes
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const ORIGEN = 'imagenes/originales';
const DESTINO = 'imagenes';

// nombre del archivo original -> anchos a generar
const IMAGENES = {
  'logo-granja-habibi': [200, 400, 800],
  'caja-huevos-blancos': [480, 800, 1200],
  'caja-huevos-rojos': [480, 800, 1200],
  'huevos-segun-su-peso': [480, 800, 1200],
};

let total = 0;
for (const [nombre, anchos] of Object.entries(IMAGENES)) {
  const entrada = path.join(ORIGEN, `${nombre}.webp`);
  for (const ancho of anchos) {
    const base = sharp(entrada).resize({ width: ancho, withoutEnlargement: true });
    const avif = await base.clone().avif({ quality: 55, effort: 6 }).toBuffer();
    const webp = await base.clone().webp({ quality: 75, effort: 6 }).toBuffer();
    await writeFile(path.join(DESTINO, `${nombre}-${ancho}.avif`), avif);
    await writeFile(path.join(DESTINO, `${nombre}-${ancho}.webp`), webp);
    total += avif.length + webp.length;
    console.log(`${nombre}-${ancho}: avif ${(avif.length / 1024).toFixed(0)} KB · webp ${(webp.length / 1024).toFixed(0)} KB`);
  }
}

// Imagen para compartir el enlace en WhatsApp / Facebook (1200x630, JPG)
await sharp(path.join(ORIGEN, 'caja-huevos-rojos.webp'))
  .resize(1200, 630, { fit: 'contain', background: '#f3e7cf' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(path.join(DESTINO, 'compartir-granja-habibi.jpg'));

// Íconos del navegador a partir del logo
const logo = path.join(ORIGEN, 'logo-granja-habibi.webp');
const icono = (tam) => sharp(logo).resize(tam, tam).png({ compressionLevel: 9, palette: true });
await icono(32).toFile(path.join(DESTINO, 'favicon-32.png'));
await icono(180).toFile('apple-touch-icon.png');
await icono(192).toFile(path.join(DESTINO, 'icono-192.png'));
await icono(512).toFile(path.join(DESTINO, 'icono-512.png'));

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

console.log(`\nTotal: ${(total / 1024).toFixed(0)} KB (todas las variantes)`);
