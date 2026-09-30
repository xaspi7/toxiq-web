'use strict';
(() => {
  const storageKey = 'toxiq.concept.v1';
  const profiles = {
    moba: {
      kind: 'TEXTOVÁ MAKRA', title: 'CALL THE SHOTS.',
      description: 'Baron, drake nebo společný reset. Krátké calls po ruce, zatímco se soustředíš na hru.',
      note: 'Ukázkové přiřazení. Texty i zkratky si zvolíš podle sebe.',
      keys: [['BARON', 'BARON NOW'], ['DRAKE', 'DRAKE IN 30'], ['PUSH', 'PUSH MID'], ['BACK', 'RESET AND BACK'], ['PING', 'ON MY WAY'], ['GG', 'GG WP']]
    },
    fps: {
      kind: 'HRANÍ A ZÁZNAM', title: 'KEEP YOUR FOCUS.',
      description: 'Ulož dobrý moment, ovládej záznam nebo mikrofon. Časté akce mají vlastní místo vedle klávesnice.',
      note: 'Příklady klávesových zkratek. Konkrétní přiřazení závisí na nastavení hry a aplikací.',
      keys: [['CLIP', 'Uložení herního klipu'], ['MIC', 'Zapnutí / ztlumení mikrofonu'], ['MAP', 'Otevření mapy'], ['SCORE', 'Přehled skóre'], ['RECORD', 'Spuštění / ukončení záznamu'], ['GG', 'GG WP']]
    },
    creator: {
      kind: 'STŘIH VIDEA', title: 'MAKE MORE.',
      description: 'Rozdělit klip, přidat značku nebo spustit export. Nejčastější kroky tvého střihu na šesti klávesách.',
      note: 'Ukázka pro střih videa. Zkratky si přiřadíš podle aplikace, kterou používáš.',
      keys: [['CUT', 'Rozdělení klipu'], ['MARK', 'Značka na časové ose'], ['PLAY', 'Přehrát / pozastavit'], ['UNDO', 'Vrátit poslední změnu'], ['SAVE', 'Uložení projektu'], ['EXPORT', 'Export videa']]
    }
  };
  const html = document.documentElement;
  const colorwayButtons = [...document.querySelectorAll('button[data-colorway]')];
  const colorwayGroup = document.querySelector('.colorway-options');
  const colorwayStatus = document.getElementById('colorway-status');
  const readyImages = new WeakMap();
  let colorwayRequest = 0;
  let currentProfile = 'moba';

  function readyImage(img) {
    if (readyImages.has(img)) return readyImages.get(img);
    const loaded = img.complete && img.naturalWidth > 0 ? Promise.resolve() : new Promise((resolve, reject) => {
      const clean = () => { img.removeEventListener('load', onLoad); img.removeEventListener('error', onError); };
      const onLoad = () => { clean(); resolve(); };
      const onError = () => { clean(); reject(new Error('Image unavailable')); };
      img.addEventListener('load', onLoad, { once: true });
      img.addEventListener('error', onError, { once: true });
      if (img.complete && img.naturalWidth === 0) img.src = img.getAttribute('src');
    });
    const ready = loaded.then(() => typeof img.decode === 'function' ? img.decode() : undefined).catch(error => {
      readyImages.delete(img);
      throw error;
    });
    readyImages.set(img, ready);
    return ready;
  }

  async function setColorway(next, persist = true) {
    if (!['black', 'white'].includes(next)) return;
    const request = ++colorwayRequest;
    colorwayGroup.setAttribute('aria-busy', 'true');
    colorwayStatus.textContent = '';
    try {
      await Promise.all([...document.querySelectorAll(`img[data-variant="${next}"]`)].map(readyImage));
      if (request !== colorwayRequest) return;
      // Keep both variants decoded in the DOM and commit the palette atomically.
      // An older load can never overwrite the visitor's latest choice.
      html.dataset.colorway = next;
      document.querySelector('meta[name="theme-color"]').content = next === 'black' ? '#090A0C' : '#F4F4F0';
      colorwayButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.colorway === next)));
      document.querySelectorAll('img[data-variant]').forEach(img => img.setAttribute('aria-hidden', String(img.dataset.variant !== next)));
      if (persist) {
        try { localStorage.setItem(storageKey, JSON.stringify({ colorway: next })); } catch { /* Preference is optional. */ }
      }
    } catch {
      if (request === colorwayRequest) colorwayStatus.textContent = 'Variantu se nepodařilo načíst. Zkus to znovu.';
    } finally {
      if (request === colorwayRequest) colorwayGroup.setAttribute('aria-busy', 'false');
    }
  }

  function setProfile(name, announce = true) {
    const profile = profiles[name];
    if (!profile) return;
    const changed = currentProfile !== name;
    currentProfile = name;
    document.querySelectorAll('[data-profile]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.profile === name)));
    const grid = document.getElementById('key-grid');
    grid.setAttribute('aria-label', `Příklady akcí profilu ${name.toUpperCase()}`);
    grid.replaceChildren();
    profile.keys.forEach(([label, action], index) => {
      const item = document.createElement('li');
      const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
      const title = document.createElement('strong'); title.textContent = label;
      const example = document.createElement('p'); example.textContent = action;
      item.append(number, title, example); grid.append(item);
      document.querySelector(`[data-diagram-label="${index}"]`).textContent = label;
    });
    document.getElementById('diagram-title').textContent = `Schéma profilu ${name.toUpperCase()}`;
    document.getElementById('diagram-description').textContent = `Šest kláves: ${profile.keys.map(key => key[0]).join(', ')}.`;
    document.getElementById('profile-kind').textContent = profile.kind;
    document.getElementById('profile-title').textContent = profile.title;
    document.getElementById('profile-description').textContent = profile.description;
    document.getElementById('profile-note').textContent = profile.note;
    if (changed && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const content = document.getElementById('profile-content');
      if (typeof content.animate === 'function') {
        content.getAnimations().forEach(animation => animation.cancel());
        content.animate([{ opacity: .65, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' });
      }
    }
    if (announce) document.getElementById('profile-status').textContent = `Zobrazen profil ${name.toUpperCase()}. ${profile.title}`;
  }

  colorwayButtons.forEach(button => button.addEventListener('click', () => setColorway(button.dataset.colorway)));
  document.querySelectorAll('[data-profile]').forEach(button => button.addEventListener('click', () => setProfile(button.dataset.profile)));
  setColorway(html.dataset.colorway, false);
  document.querySelectorAll('img[data-variant]').forEach(img => { readyImage(img).catch(() => {}); });
  setProfile('moba', false);
  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
