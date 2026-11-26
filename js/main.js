/* Granja Habibi · interacciones del sitio (sin dependencias) */
(() => {
  'use strict';

  const WHATSAPP = '50587035575';
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  document.documentElement.classList.add('js');

  /* ---------- Año del pie ---------- */
  const anio = $('#anio');
  if (anio) anio.textContent = String(new Date().getFullYear());

  /* ---------- Sombra del encabezado al hacer scroll ---------- */
  const encabezado = $('#encabezado');
  const alScroll = () => encabezado?.classList.toggle('con-sombra', window.scrollY > 10);
  window.addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  /* ---------- Menú móvil ---------- */
  const menuBtn = $('#menuBtn');
  const nav = $('#menuPrincipal');
  const usoIcono = menuBtn?.querySelector('use');

  const cerrarMenu = (devolverFoco = false) => {
    if (!nav?.classList.contains('abierto')) return;
    nav.classList.remove('abierto');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Abrir menú');
    usoIcono?.setAttribute('href', '#i-menu');
    document.body.style.overflow = '';
    if (devolverFoco) menuBtn.focus();
  };

  const abrirMenu = () => {
    nav.classList.add('abierto');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Cerrar menú');
    usoIcono?.setAttribute('href', '#i-cerrar');
    document.body.style.overflow = 'hidden';
  };

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => (nav.classList.contains('abierto') ? cerrarMenu() : abrirMenu()));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) cerrarMenu(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarMenu(true); });
    // Si se agranda la pantalla con el menú abierto, se cierra para no bloquear el scroll
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) cerrarMenu(); });
  }

  /* ---------- Enlace activo del menú según la sección visible ---------- */
  const enlaces = $$('.nav__lista a');
  const secciones = enlaces.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && secciones.length) {
    const obsMenu = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        enlaces.forEach((a) => {
          if (a.getAttribute('href') === `#${entrada.target.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secciones.forEach((s) => obsMenu.observe(s));
  }

  /* ---------- Aparición suave al hacer scroll ---------- */
  const revelables = $$('.revelar');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visible');
          obs.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revelables.forEach((el) => obs.observe(el));
  } else {
    revelables.forEach((el) => el.classList.add('visible'));
  }

  /* ---------- Visor de imágenes ---------- */
  const visor = $('#visor');
  const visorImg = $('#visorImg');
  if (visor && visorImg && typeof visor.showModal === 'function') {
    $$('[data-ampliar]').forEach((btn) => {
      btn.addEventListener('click', () => {
        visorImg.src = btn.dataset.ampliar;
        visorImg.alt = btn.dataset.alt || '';
        visor.showModal();
      });
    });
    $('#visorCerrar')?.addEventListener('click', () => visor.close());
    // Cerrar al tocar fuera de la imagen
    visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
    visor.addEventListener('close', () => { visorImg.removeAttribute('src'); });
  } else {
    // Navegadores sin <dialog>: abrir la imagen directamente
    $$('[data-ampliar]').forEach((btn) => btn.addEventListener('click', () => window.open(btn.dataset.ampliar, '_blank', 'noopener')));
  }

  /* ---------- Botones de producto: preseleccionan el formulario ---------- */
  const selProducto = $('#producto');
  $$('[data-producto]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (selProducto) selProducto.value = btn.dataset.producto;
    });
  });

  /* ---------- Formulario de pedido → WhatsApp ---------- */
  const form = $('#formPedido');
  if (form) {
    const marcarError = (campo, mostrar) => {
      const error = $(`#${campo.id}-error`);
      campo.setAttribute('aria-invalid', mostrar ? 'true' : 'false');
      if (error) {
        error.hidden = !mostrar;
        if (mostrar) campo.setAttribute('aria-describedby', error.id);
        else campo.removeAttribute('aria-describedby');
      }
    };

    const limpiar = (texto) => texto.replace(/\s+/g, ' ').trim();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = form.elements.nombre;
      const cantidad = form.elements.cantidad;
      const valorNombre = limpiar(nombre.value);
      const valorCantidad = Number.parseInt(cantidad.value, 10);

      const nombreOk = valorNombre.length >= 2;
      const cantidadOk = Number.isInteger(valorCantidad) && valorCantidad >= 1 && valorCantidad <= 500;
      marcarError(nombre, !nombreOk);
      marcarError(cantidad, !cantidadOk);
      if (!nombreOk) { nombre.focus(); return; }
      if (!cantidadOk) { cantidad.focus(); return; }

      const entrega = form.elements.entrega.value;
      const direccion = limpiar(form.elements.direccion.value);
      const notas = limpiar(form.elements.notas.value);

      const lineas = [
        'Hola Granja Habibi, quiero hacer un pedido:',
        `• Producto: ${form.elements.producto.value}`,
        `• Tamaño: ${form.elements.tamano.value}`,
        `• Cantidad: ${valorCantidad} cajilla${valorCantidad === 1 ? '' : 's'} de 30`,
        `• Entrega: ${entrega}`,
      ];
      if (direccion) lineas.push(`• Dirección: ${direccion}`);
      if (notas) lineas.push(`• Notas: ${notas}`);
      lineas.push(`• Nombre: ${valorNombre}`);

      const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lineas.join('\n'))}`;
      // Nota: con la opción 'noopener' window.open siempre devuelve null,
      // por eso se corta el vínculo manualmente.
      const ventana = window.open(url, '_blank');
      if (ventana) ventana.opener = null;
      else window.location.href = url; // si el navegador bloquea la ventana nueva
    });

    // Quitar el error en cuanto la persona corrige
    ['nombre', 'cantidad'].forEach((nombreCampo) => {
      form.elements[nombreCampo].addEventListener('input', (e) => {
        if (e.target.getAttribute('aria-invalid') === 'true') marcarError(e.target, false);
      });
    });
  }

  /* ---------- Mapa bajo demanda (ahorra datos y acelera la carga) ---------- */
  const btnMapa = $('#cargarMapa');
  btnMapa?.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.google.com/maps?q=San%20Ram%C3%B3n%2C%20Matagalpa%2C%20Nicaragua&z=14&output=embed';
    iframe.title = 'Mapa de San Ramón, Matagalpa, Nicaragua';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    btnMapa.replaceWith(iframe);
  }, { once: true });
})();
