# Granja Habibi · Sitio web

Sitio web de **Granja Habibi**, productora de huevos frescos en San Ramón, Matagalpa, Nicaragua.
Sitio estático (HTML + CSS + JS, sin frameworks), pensado para hosting compartido local (cPanel / Apache / LiteSpeed).

## Secciones

Del diseño original: Inicio · Historia · Huevos · Arte (galería) · Testimonios · Proceso · Contacto con mapa · Pie de página.

Agregadas con el mismo diseño: Granja Habibi (logo) · Cajillas de 30 (XL, L, M y blancos) · Huevos según su peso ·
Nuestra granja por dentro · Huevos por mayor · Pedidos por WhatsApp · Preguntas frecuentes.

Efectos: desplazamiento suave, aparición escalonada de tarjetas, barra de progreso, menú activo según la sección
y botón para volver arriba (se desactivan si el visitante pide menos movimiento en su sistema).

## Estructura

```
granja-habibi/
├── index.html            Página principal (HTML, CSS y JS del diseño original + secciones nuevas)
├── 404.html              Página de error
├── .htaccess             HTTPS, compresión, caché y seguridad (Apache)
├── robots.txt            Reglas para buscadores
├── sitemap.xml           Mapa del sitio (con imágenes)
├── manifest.webmanifest  Ícono al "agregar a pantalla de inicio"
├── favicon.ico / apple-touch-icon.png
├── imagenes/             Imágenes optimizadas en WebP, en varios tamaños
│   ├── marca/            Logo
│   ├── granja/           Pollitos, gallinas y entregas
│   ├── cajillas/         Cajillas de 30 huevos
│   ├── galeria/          Fotos de huevos (Arte en cáscara)
│   ├── tamanos/          Huevos según su peso
│   ├── iconos/           Íconos del navegador
│   ├── redes/            Imagen para compartir en WhatsApp/Facebook (JPG)
│   └── originales/       Imágenes originales por carpeta (no se suben al hosting)
├── scripts/              Herramientas: optimizar imágenes, servidor local, cambiar dominio
└── tests/                Pruebas automáticas del sitio
```

## Comandos

Requiere [Node.js](https://nodejs.org) 20 o superior.

| Comando | Qué hace |
|---|---|
| `npm install` | Instala la herramienta de optimización de imágenes |
| `npm start` | Abre el sitio en `http://localhost:8080` |
| `npm test` | Revisa enlaces, imágenes, SEO, datos estructurados y peso de archivos |
| `npm run imagenes` | Regenera `imagenes/` a partir de `imagenes/originales/` |
| `npm run dominio -- https://tudominio.com.ni` | Cambia el dominio en todos los archivos SEO |

### Agregar o cambiar una imagen

1. Copiá la imagen original en la carpeta que corresponda dentro de `imagenes/originales/`.
2. Agregá su nombre y tamaños en `scripts/optimizar-imagenes.mjs`.
3. Corré `npm run imagenes` y usá las versiones de `imagenes/` en el HTML.

## Publicar en el hosting

1. Si el dominio no es `granjahabibi.com.ni`, corré `npm run dominio -- https://tu-dominio`.
2. Subí **solo** estos archivos a `public_html/` (por el Administrador de archivos de cPanel o FTP):
   `index.html`, `404.html`, `.htaccess`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`,
   `favicon.ico`, `apple-touch-icon.png` y la carpeta `imagenes/` (sin la subcarpeta `originales/`).
3. Activá el certificado SSL gratuito (AutoSSL / Let's Encrypt) en cPanel; el `.htaccess` redirige todo a HTTPS.
4. Si el hosting usa **Nginx** en lugar de Apache, pedí al soporte que active compresión gzip, caché larga para `/imagenes/` y la página `404.html`.

## SEO: pasos después de publicar

1. **Google Search Console**: agregá el dominio, verificalo y enviá `https://tu-dominio/sitemap.xml`.
2. **Perfil de Empresa en Google (Google Maps)**: creá o reclamá la ficha "Huevos Habibí / Granja Habibi" con la misma
   dirección, teléfono y horario que aparecen en el sitio, y pegá el enlace del sitio web. Es lo que más
   ayuda para aparecer en búsquedas como "huevos en Matagalpa".
3. Pedí a clientes reales que dejen reseñas en Google Maps.
4. Probá los datos estructurados en la [Prueba de resultados enriquecidos](https://search.google.com/test/rich-results).
5. Compartí el enlace en Facebook, Instagram y el estado de WhatsApp Business (la vista previa usa `imagenes/compartir-granja-habibi.jpg`).

## Datos del negocio que conviene revisar

Estos datos vienen del sitio anterior; confirmá que sean correctos antes de publicar:
teléfono/WhatsApp (+505 8703 5575), dirección (Carretera a Yucul, 1 km al sur), horario (lun–sáb 6:00–17:00),
año de fundación (1975), coordenadas del mapa y formas de pago.
