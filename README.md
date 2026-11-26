# Granja Habibi · Sitio web

Sitio web de **Granja Habibi**, productora de huevos frescos en San Ramón, Matagalpa, Nicaragua.
Sitio estático (HTML + CSS + JS, sin frameworks), pensado para hosting compartido local (cPanel / Apache / LiteSpeed).

## Secciones

Inicio · Beneficios · Nosotros · Productos (huevos blancos, rojos y por mayor) · Tamaños según peso ·
Proceso artesanal · Venta por mayor · Zonas de entrega · Testimonios · Pedido por WhatsApp ·
Preguntas frecuentes · Contacto con mapa · Pie de página · Botón flotante de WhatsApp.

## Estructura

```
granja-habibi/
├── index.html            Página principal
├── 404.html              Página de error
├── .htaccess             HTTPS, compresión, caché y seguridad (Apache)
├── robots.txt            Reglas para buscadores
├── sitemap.xml           Mapa del sitio (con imágenes)
├── manifest.webmanifest  Ícono al "agregar a pantalla de inicio"
├── favicon.ico / apple-touch-icon.png
├── css/estilos.css
├── js/main.js
├── img/                  Imágenes optimizadas (AVIF + WebP, 3 tamaños)
├── src-images/           Imágenes originales (no se suben al hosting)
├── scripts/              Herramientas: optimizar imágenes, servidor local, cambiar dominio
└── tests/                Pruebas automáticas del sitio
```

## Comandos

Requiere [Node.js](https://nodejs.org) 20 o superior.

| Comando | Qué hace |
|---|---|
| `npm install` | Instala la herramienta de optimización de imágenes |
| `npm start` | Abre el sitio en `http://localhost:8080` con los mismos encabezados de seguridad que producción |
| `npm test` | Revisa enlaces, imágenes, SEO, datos estructurados y peso de archivos |
| `npm run imagenes` | Regenera `img/` a partir de `src-images/` |
| `npm run dominio -- https://tudominio.com.ni` | Cambia el dominio en todos los archivos SEO |

### Agregar o cambiar una imagen

1. Copiá la imagen original en `src-images/` (formato `.webp`).
2. Agregá su nombre y tamaños en `scripts/optimizar-imagenes.mjs`.
3. Corré `npm run imagenes` y usá las versiones de `img/` en el HTML con `<picture>`.

## Publicar en el hosting

1. Si el dominio no es `granjahabibi.com.ni`, corré `npm run dominio -- https://tu-dominio`.
2. Subí **solo** estos archivos a `public_html/` (por el Administrador de archivos de cPanel o FTP):
   `index.html`, `404.html`, `.htaccess`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`,
   `favicon.ico`, `apple-touch-icon.png` y las carpetas `css/`, `js/`, `img/`.
3. Activá el certificado SSL gratuito (AutoSSL / Let's Encrypt) en cPanel; el `.htaccess` redirige todo a HTTPS.
4. Si el hosting usa **Nginx** en lugar de Apache, pedí al soporte que active compresión gzip, caché larga para `/img/` y la página `404.html`.

## SEO: pasos después de publicar

1. **Google Search Console**: agregá el dominio, verificalo y enviá `https://tu-dominio/sitemap.xml`.
2. **Perfil de Empresa en Google (Google Maps)**: creá o reclamá la ficha "Granja Habibi" con la misma
   dirección, teléfono y horario que aparecen en el sitio, y pegá el enlace del sitio web. Es lo que más
   ayuda para aparecer en búsquedas como "huevos en Matagalpa".
3. Pedí a clientes reales que dejen reseñas en Google Maps y reemplazá los testimonios del sitio por reseñas reales.
4. Probá los datos estructurados en la [Prueba de resultados enriquecidos](https://search.google.com/test/rich-results).
5. Compartí el enlace en Facebook, Instagram y el estado de WhatsApp Business (la vista previa usa `img/og-granja-habibi.jpg`).

## Datos del negocio que conviene revisar

Estos datos vienen del sitio anterior; confirmá que sean correctos antes de publicar:
teléfono/WhatsApp (+505 8703 5575), dirección (Carretera a Yucul, 1 km al sur), horario (lun–sáb 6:00–17:00),
año de fundación (1975), coordenadas del mapa y formas de pago.
