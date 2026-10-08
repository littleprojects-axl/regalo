(() => {
  'use strict';

  /* =====================================================================
     TIEMPOS (en milisegundos). Aquí cambias el ritmo de toda la historia.
     Si subes un número, esa parte se vuelve más lenta.
     (La duración de la subida de la montaña está en style.css: --montana)
     ===================================================================== */
  const T = {
    // Escena 1: regalo
    sacudidaCaja:       520,   // la caja reacciona al toque
    luzAntesDeChispas:  650,   // desde que se abre la tapa hasta los destellos
    luzAntesDelCielo:   1100,  // desde los destellos hasta que empieza a aparecer el cielo
    cieloAparece:       1500,  // desde que empieza el cielo hasta cambiar de escena

    // Escena 2: cielo y Cinnamoroll
    botonVamos:         3800,  // cuándo aparece el botón "Vamos" (también puede tocar a Cinnamoroll)

    // Escena 3: vuelo
    textoCieloSeVa:     900,   // el texto del cielo desaparece antes de empezar a volar
    vueloAntesMontana:  4500,  // cuánto vuela antes de que empiece a aparecer la montaña
    montanaSube:        6500,  // cuánto dura la subida de la montaña (parecido a --montana)
    llegada:            2600,  // tiempo para que Cinnamoroll se coloque junto al cofre

    // Escena 4: cofre
    sacudidaCofre:      520,
    tapaCofre:          1500,  // desde que se abre la tapa hasta que sube el ramo
    subidaRamo:         3400,  // cuánto tarda el ramo en subir
    antesDelMensaje:    1400   // pausa antes del mensaje final
  };

  /* Color de la barra del navegador en el celular (opcional) */
  const THEME = { 'scene-gift': '#000000', 'scene-sky': '#a2d4f4', 'scene-flight': '#a2d4f4', 'scene-chest': '#a2d4f4' };

  /* ===================================================================== */

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const app = $('#app');
  const fx = $('#fx');
  const bloom = $('#bloom');
  const themeMeta = $('meta[name="theme-color"]');

  const sceneSky = $('#scene-sky');
  const sceneFlight = $('#scene-flight');
  const sceneChest = $('#scene-chest');
  const gift = $('#gift');
  const chest = $('#chest');
  const bouquet = $('#bouquet');
  const finalBox = $('#final');

  let busy = false;
  let timers = [];

  /* ------------------------- Utilidades ------------------------- */

  function showScene(id) {
    $$('.scene').forEach((s) => s.classList.toggle('active', s.id === id));
    app.dataset.scene = id;
    if (themeMeta && THEME[id]) themeMeta.setAttribute('content', THEME[id]);
  }

  function setBg(name) { app.dataset.bg = name; }

  /* Destellos suaves que suben desde un elemento */
  function sparkle(source, opts = {}) {
    if (reduceMotion) return;
    const {
      count = 9, spreadX = 90, rise = 150, size = [3, 6],
      dur = [1800, 2800], delay = [0, 600], yFactor = 0.3,
      color = '#fff8dc', glow = 'rgba(255, 244, 205, .85)'
    } = opts;

    const a = app.getBoundingClientRect();
    const r = source.getBoundingClientRect();
    const cx = r.left + r.width / 2 - a.left;
    const cy = r.top + r.height * yFactor - a.top;

    for (let i = 0; i < count; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      s.style.left = (cx + rand(-r.width * 0.28, r.width * 0.28)) + 'px';
      s.style.top = cy + 'px';
      s.style.setProperty('--sz', rand(size[0], size[1]).toFixed(1) + 'px');
      s.style.setProperty('--dx', rand(-spreadX, spreadX).toFixed(0) + 'px');
      s.style.setProperty('--dy', (-rise * rand(0.5, 1.15)).toFixed(0) + 'px');
      s.style.setProperty('--dur', rand(dur[0], dur[1]).toFixed(0) + 'ms');
      s.style.setProperty('--dl', rand(delay[0], delay[1]).toFixed(0) + 'ms');
      s.style.setProperty('--c', color);
      s.style.setProperty('--g', glow);
      s.addEventListener('animationend', () => s.remove(), { once: true });
      fx.appendChild(s);
    }
  }

  function placeBloomAt(el) {
    const a = app.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    bloom.style.left = (r.left + r.width / 2 - a.left) + 'px';
    bloom.style.top = (r.top + r.height * 0.35 - a.top) + 'px';
  }

  /* --------------------------- ESCENA 1: regalo --------------------------- */

  async function openGift() {
    if (busy || app.dataset.scene !== 'scene-gift') return;
    busy = true;

    gift.classList.add('shake');
    await wait(T.sacudidaCaja);
    gift.classList.remove('shake');

    gift.classList.add('open');
    await wait(T.luzAntesDeChispas);

    sparkle(gift, { count: 9, spreadX: 80, rise: 150 });
    placeBloomAt(gift);
    bloom.classList.add('go');
    await wait(T.luzAntesDelCielo);

    setBg('sky');                         // el cielo empieza a aparecer
    await wait(T.cieloAparece);

    showScene('scene-sky');
    app.dataset.actor = 'intro';          // Cinnamoroll aparece
    sceneSky.classList.remove('ready', 'leaving');
    timers.push(setTimeout(() => sceneSky.classList.add('ready'), T.botonVamos));
    busy = false;
  }

  /* ------------------ ESCENAS 2 y 3: cielo, vuelo y llegada ------------------ */

  async function followCinna() {
    if (busy || app.dataset.actor !== 'intro') return;
    busy = true;
    timers.forEach(clearTimeout);

    sceneSky.classList.add('leaving');
    app.dataset.actor = 'fly';            // Cinnamoroll empieza a volar
    app.dataset.flight = 'on';            // nubes y rayitas pasan rápido
    await wait(T.textoCieloSeVa);

    showScene('scene-flight');            // "Ya casi llegamos..."
    await wait(T.vueloAntesMontana);

    app.dataset.mountain = 'up';          // la montaña va apareciendo
    await wait(T.montanaSube - 1800);

    sceneFlight.classList.add('hide-text');
    app.dataset.flight = 'arrive';        // las nubes rápidas se van
    app.dataset.actor = 'guide';          // Cinnamoroll se coloca junto al cofre
    await wait(T.llegada);

    showScene('scene-chest');
    busy = false;
  }

  /* ----------------------------- ESCENA 4: cofre ----------------------------- */

  async function openChest() {
    if (busy || app.dataset.scene !== 'scene-chest') return;
    busy = true;

    app.dataset.chest = 'shake';
    await wait(T.sacudidaCofre);

    app.dataset.chest = 'open';
    sceneChest.classList.add('opened');
    app.dataset.actor = 'bye';            // Cinnamoroll se despide para dejar el ramo solo

    await wait(500);
    sparkle(chest, {
      count: 11, spreadX: 120, rise: 190, yFactor: 0.4,
      color: '#ffd568', glow: 'rgba(255, 196, 70, .9)'
    });

    await wait(T.tapaCofre);

    bouquet.classList.add('show');        // el ramo sube desde dentro
    await wait(T.subidaRamo * 0.45);
    sparkle(bouquet, {
      count: 8, spreadX: 130, rise: 90, yFactor: 0.4, size: [3, 5],
      dur: [2200, 3200], delay: [0, 1200],
      color: '#ffd568', glow: 'rgba(255, 196, 70, .9)'
    });
    await wait(T.subidaRamo * 0.55);

    app.dataset.chest = 'done';           // la luz baja para que el ramo sea el protagonista
    await wait(T.antesDelMensaje);

    finalBox.classList.add('show');       // mensaje final
    busy = false;
  }

  /* ------------------------------- Reinicio ------------------------------- */

  function restart() {
    if (busy) return;
    busy = true;
    timers.forEach(clearTimeout);
    timers = [];

    app.classList.add('resetting');       // apaga transiciones un instante

    gift.classList.remove('open', 'shake');
    bloom.classList.remove('go');
    sceneSky.classList.remove('ready', 'leaving');
    sceneFlight.classList.remove('hide-text');
    sceneChest.classList.remove('opened');
    bouquet.classList.remove('show');
    finalBox.classList.remove('show');
    $$('.spark', fx).forEach((s) => s.remove());
    ['actor', 'flight', 'mountain', 'chest'].forEach((k) => delete app.dataset[k]);
    setBg('night');
    showScene('scene-gift');

    void app.offsetWidth;                 // fuerza el repintado
    requestAnimationFrame(() => requestAnimationFrame(() => {
      app.classList.remove('resetting');
      busy = false;
    }));
  }

  /* ------------------------------ Eventos ------------------------------ */

  $('#gift').addEventListener('click', openGift);
  $('#btn-gift').addEventListener('click', openGift);
  $('#cinna').addEventListener('click', followCinna);
  $('#btn-follow').addEventListener('click', followCinna);
  $('#chest').addEventListener('click', openChest);
  $('#btn-chest').addEventListener('click', openChest);
  $('#btn-restart').addEventListener('click', restart);

  /* Precarga de las imágenes importantes para que no "salten" al aparecer */
  ['assets/cinnamoroll.png', 'assets/tulipanes.png'].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
})();