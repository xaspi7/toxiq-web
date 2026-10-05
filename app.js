'use strict';
(() => {
  const html = document.documentElement;
  const storageKey = 'toxiq.concept.v1';
  const languageKey = 'toxiq-language';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const profiles = {
    moba: [['BARON', 'BARON NOW', 'BARON NOW'], ['DRAKE', 'DRAKE IN 30', 'DRAKE IN 30'], ['PUSH', 'PUSH MID', 'PUSH MID'], ['BACK', 'RESET AND BACK', 'RESET AND BACK'], ['PING', 'ON MY WAY', 'ON MY WAY'], ['GG', 'GG WP', 'GG WP']],
    fps: [['CLIP', 'Save a game clip', 'Uložit herní klip'], ['MIC', 'Toggle microphone', 'Přepnout mikrofon'], ['MAP', 'Open map', 'Otevřít mapu'], ['SCORE', 'Show scoreboard', 'Zobrazit skóre'], ['RECORD', 'Start / stop recording', 'Spustit / zastavit záznam'], ['GG', 'GG WP', 'GG WP']],
    creator: [['CUT', 'Split clip', 'Rozdělit klip'], ['MARK', 'Timeline marker', 'Značka na časové ose'], ['PLAY', 'Play / pause', 'Přehrát / pozastavit'], ['UNDO', 'Undo last change', 'Vrátit poslední změnu'], ['SAVE', 'Save project', 'Uložit projekt'], ['EXPORT', 'Export video', 'Exportovat video']]
  };
  const pageTitles = {
    home: ['TOXIQ — GG. GO NEXT.', 'TOXIQ — GG. GO NEXT.'],
    pad: ['TOXIQ Pad — Six keys. Your call.', 'TOXIQ Pad — Šest kláves. Tvoje hra.'],
    app: ['TOXIQ App — Configurator for Windows', 'TOXIQ Apka — Configurator pro Windows']
  };
  const descriptions = {
    home: ['Six programmable keys for your messages and shortcuts. Meet the TOXIQ pad.', 'Šest programovatelných kláves pro tvoje zprávy a zkratky. Poznej pad TOXIQ.'],
    pad: ['Six mechanical keys for game calls, shortcuts and editing. Pick a profile and make it yours.', 'Šest mechanických kláves pro herní zprávy, zkratky a střih. Vyber si profil a nastav si svůj pad.'],
    app: ['Download TOXIQ Configurator for Windows. Set your messages and shortcuts, then save them to your pad.', 'Stáhni si TOXIQ Configurator pro Windows. Nastav zprávy a zkratky a ulož je do svého padu.']
  };
  let language = html.lang === 'cs' ? 'cs' : 'en';
  let currentProfile = 'moba';
  let colorwayRequest = 0;
  const readyImages = new WeakMap();

  function readPreference(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function savePreference(key, value) {
    try { localStorage.setItem(key, value); } catch { /* The page works without storage. */ }
  }
  function updateThemeControl() {
    const light = html.dataset.colorway === 'white';
    const toggle = document.querySelector('[data-theme-toggle]');
    const labels = light ? ['Switch to dark mode', 'Přepnout na tmavý režim'] : ['Switch to light mode', 'Přepnout na světlý režim'];
    toggle.setAttribute('aria-label', labels[language === 'cs' ? 1 : 0]);
    toggle.dataset.enAriaLabel = labels[0];
    toggle.dataset.csAriaLabel = labels[1];
  }
  function readyImage(img) {
    if (readyImages.has(img)) return readyImages.get(img);
    const promise = (async () => {
      if (!img.complete) await new Promise((resolve, reject) => {
        const cleanup = () => { img.removeEventListener('load', loaded); img.removeEventListener('error', failed); };
        const loaded = () => { cleanup(); resolve(); };
        const failed = () => { cleanup(); reject(new Error('Image unavailable')); };
        img.addEventListener('load', loaded, { once: true });
        img.addEventListener('error', failed, { once: true });
      });
      if (!img.naturalWidth) throw new Error('Image unavailable');
      if (typeof img.decode === 'function') await img.decode();
    })().catch(error => { readyImages.delete(img); throw error; });
    readyImages.set(img, promise);
    return promise;
  }
  async function setColorway(next, persist = true) {
    if (!['black', 'white'].includes(next)) return;
    const request = ++colorwayRequest;
    const groups = [...document.querySelectorAll('.colorway-options')];
    const status = document.getElementById('colorway-status');
    groups.forEach(group => group.setAttribute('aria-busy', 'true'));
    status.textContent = '';
    try {
      await Promise.all([...document.querySelectorAll(`img[data-variant="${next}"]`)].map(readyImage));
      if (request !== colorwayRequest) return;
      html.dataset.colorway = next;
      document.querySelector('meta[name="theme-color"]').content = next === 'white' ? '#F4F4F0' : '#090A0C';
      document.querySelectorAll('[data-colorway]').forEach(button => {
        if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.colorway === next));
      });
      document.querySelectorAll('img[data-variant]').forEach(img => img.setAttribute('aria-hidden', String(img.dataset.variant !== next)));
      updateThemeControl();
      if (persist) {
        let preferences = {};
        try { preferences = JSON.parse(readPreference(storageKey) || '{}') || {}; } catch { /* Use a fresh preference. */ }
        savePreference(storageKey, JSON.stringify({ ...preferences, colorway: next }));
      }
    } catch {
      if (request === colorwayRequest) status.textContent = language === 'cs' ? 'Variantu se nepodařilo načíst. Zkus to znovu.' : 'Could not load this colourway. Try again.';
    } finally {
      if (request === colorwayRequest) groups.forEach(group => group.setAttribute('aria-busy', 'false'));
    }
  }
  function setProfile(name, announce = true) {
    const grid = document.getElementById('key-grid');
    if (!grid || !profiles[name]) return;
    const changed = currentProfile !== name;
    currentProfile = name;
    document.querySelectorAll('[data-profile]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.profile === name)));
    grid.setAttribute('aria-label', `${name.toUpperCase()} ${language === 'cs' ? '— ukázkové akce' : 'action examples'}`);
    [...grid.children].forEach((key, index) => {
      const [label, en, cs] = profiles[name][index];
      key.querySelector('strong').textContent = label;
      key.querySelector('.key-action').textContent = language === 'cs' ? cs : en;
    });
    if (changed && !reducedMotion.matches && typeof grid.animate === 'function') {
      grid.getAnimations().forEach(animation => animation.cancel());
      grid.animate([{ opacity: .5, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' });
    }
    if (announce) document.getElementById('profile-status').textContent = `${language === 'cs' ? 'Zobrazen profil' : 'Showing profile'} ${name.toUpperCase()}.`;
  }
  function setLanguage(next, persist = true) {
    if (!['en', 'cs'].includes(next)) return;
    language = next;
    html.lang = next;
    document.querySelectorAll('[data-en][data-cs]').forEach(node => { node.textContent = node.dataset[next]; });
    for (const attribute of ['aria-label', 'alt']) {
      document.querySelectorAll(`[data-en-${attribute}]`).forEach(node => node.setAttribute(attribute, node.getAttribute(`data-${next}-${attribute}`)));
    }
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === next)));
    const index = next === 'cs' ? 1 : 0;
    document.title = pageTitles[html.dataset.page][index];
    document.querySelector('meta[property="og:title"]').content = document.title;
    document.querySelector('meta[name="description"]').content = descriptions[html.dataset.page][index];
    document.querySelector('meta[property="og:description"]').content = descriptions[html.dataset.page][index];
    updateThemeControl();
    setProfile(currentProfile, false);
    if (persist) savePreference(languageKey, next);
  }

  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  document.querySelectorAll('button[data-colorway]').forEach(button => button.addEventListener('click', () => setColorway(button.dataset.colorway)));
  document.querySelector('[data-theme-toggle]').addEventListener('click', () => setColorway(html.dataset.colorway === 'black' ? 'white' : 'black'));
  document.querySelectorAll('[data-profile]').forEach(button => button.addEventListener('click', () => setProfile(button.dataset.profile)));
  setLanguage(readPreference(languageKey) === 'cs' ? 'cs' : 'en', false);
  setColorway(html.dataset.colorway, false);
  document.querySelectorAll('img[data-variant]').forEach(img => readyImage(img).catch(() => {}));
  document.getElementById('year').textContent = String(new Date().getFullYear());

  // Scroll only changes the product and approved Q. No scroll interception or loop.
  const stages = [...document.querySelectorAll('[data-motion]')];
  let scheduled = false;
  function drawMotion() {
    scheduled = false;
    stages.forEach(stage => {
      const rect = stage.getBoundingClientRect();
      const start = html.dataset.page === 'home' ? 0 : Math.max(0, rect.top + window.scrollY - window.innerHeight * .72);
      // A short page needs a short motion range; viewport-wide interpolation
      // barely moved the product on phones, even at the end of the page.
      const distance = Math.max(140, Math.min(320, rect.height * .5));
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
      const still = reducedMotion.matches;
      stage.style.setProperty('--lift', `${(still ? 0 : 12 - progress * 24).toFixed(2)}px`);
      stage.style.setProperty('--turn', `${(still ? 0 : 4 - progress * 12).toFixed(2)}deg`);
      stage.style.setProperty('--scale', (still ? 1 : .97 + progress * .06).toFixed(3));
      stage.style.setProperty('--q-turn', `${(still ? -22 : -22 + progress * 58).toFixed(2)}deg`);
      stage.style.setProperty('--q-shift', `${(still ? 0 : 18 - progress * 52).toFixed(2)}px`);
      stage.style.setProperty('--q-slide', `${(still ? 0 : -8 + progress * 26).toFixed(2)}px`);
    });
  }
  function requestMotion() {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(drawMotion); }
  }
  if (stages.length) {
    window.addEventListener('scroll', requestMotion, { passive: true });
    window.addEventListener('resize', requestMotion, { passive: true });
    reducedMotion.addEventListener('change', requestMotion);
    requestMotion();
  }
  const legacyPages = { '#produkt': 'pad.html', '#makra': 'pad.html#profiles', '#jak-to-funguje': 'pad.html', '#downloads': 'app.html', '#kontakt': 'app.html' };
  function redirectLegacyLink() {
    if (html.dataset.page === 'home' && legacyPages[window.location.hash]) window.location.replace(legacyPages[window.location.hash]);
  }
  window.addEventListener('hashchange', redirectLegacyLink);
  redirectLegacyLink();
})();
