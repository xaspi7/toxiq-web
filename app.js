'use strict';
(() => {
  const storageKey = 'toxiq.concept.v1';
  const profiles = {
    moba: {
      kind: 'TEXTOVÁ MAKRA', title: 'CALL THE SHOTS.',
      description: 'Baron, drake nebo společný reset. Krátké calls po ruce, zatímco se soustředíš na hru.',
      keys: [ ['BARON', 'BARON NOW'], ['DRAKE', 'DRAKE IN 30'], ['PUSH', 'PUSH MID'], ['BACK', 'RESET AND BACK'], ['PING', 'ON MY WAY'], ['GG', 'GG WP'] ]
    },
    fps: {
      kind: 'TEXTOVÁ MAKRA', title: 'INFO FIRST.',
      description: 'Předat info o situaci. Zavolat rotaci. Domluvit další kolo. Míň psaní mezi jednotlivými akcemi.',
      keys: [ ['A SITE', 'ENEMY A SITE'], ['B SITE', 'ENEMY B SITE'], ['ROTATE', 'ROTATE NOW'], ['HOLD', 'HOLD POSITION'], ['ECO', 'ECO NEXT ROUND'], ['GG', 'GG WP'] ]
    },
    creator: {
      kind: 'KLÁVESOVÉ ZKRATKY', title: 'MAKE MORE.',
      description: 'Kopírovat, uložit nebo vrátit poslední změnu. Časté zkratky na jednom místě, bez hledání kombinací na klávesnici.',
      keys: [ ['COPY', 'Ctrl+C'], ['PASTE', 'Ctrl+V'], ['UNDO', 'Ctrl+Z'], ['SAVE', 'Ctrl+S'], ['REDO', 'Ctrl+Shift+Z'], ['EXPORT', 'Ctrl+Shift+E'] ]
    }
  };
  let colorway = 'black';
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (['black', 'white'].includes(saved?.colorway)) colorway = saved.colorway;
  } catch { /* Colorway selection still works when storage is unavailable. */ }

  function setColorway(next) {
    colorway = next;
    document.documentElement.dataset.colorway = colorway;
    document.querySelector('meta[name="theme-color"]').content = colorway === 'black' ? '#090A0C' : '#F4F4F0';
    document.querySelectorAll('.brand-image').forEach(img => { img.src = `assets/wordmark-${colorway}.svg`; });
    document.querySelector('.signature').src = colorway === 'black' ? 'assets/signature-q.svg' : 'assets/signature-q-white.svg';
    const product = document.getElementById('product-image');
    product.src = `assets/product-${colorway}.svg`;
    product.alt = `Koncept ${colorway === 'black' ? 'černého' : 'bílého'} makropadu TOXIQ se šesti klávesami BARON, DRAKE, PUSH, BACK, PING a GG.`;
    document.querySelectorAll('button[data-colorway]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.colorway === colorway)));
  }

  function setProfile(name) {
    const profile = profiles[name];
    if (!profile) return;
    document.querySelectorAll('[data-profile]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.profile === name)));
    const grid = document.getElementById('key-grid');
    grid.setAttribute('aria-label', `Příklady akcí profilu ${name.toUpperCase()}`);
    grid.replaceChildren();
    profile.keys.forEach(([label, action], index) => {
      const item = document.createElement('div'); item.className = 'key-example'; item.setAttribute('role', 'listitem');
      const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
      const title = document.createElement('strong'); title.textContent = label;
      const example = document.createElement('p'); example.textContent = action;
      item.append(number, title, example); grid.append(item);
    });
    document.getElementById('profile-kind').textContent = profile.kind;
    document.getElementById('profile-title').textContent = profile.title;
    document.getElementById('profile-description').textContent = profile.description;
  }

  document.querySelectorAll('button[data-colorway]').forEach(button => button.addEventListener('click', () => {
    setColorway(button.dataset.colorway);
    try { localStorage.setItem(storageKey, JSON.stringify({ colorway })); } catch { /* Optional preference. */ }
  }));
  document.querySelectorAll('[data-profile]').forEach(button => button.addEventListener('click', () => setProfile(button.dataset.profile)));
  document.querySelectorAll('[data-load-profile]').forEach(button => button.addEventListener('click', () => {
    setProfile(button.dataset.loadProfile);
    document.getElementById('makra').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }));
  setColorway(colorway); setProfile('moba');
  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
