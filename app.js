'use strict';
(() => {
  const storageKey = 'toxiq.concept.v1';
  const defaults = {
    moba: [ ['BARON', 'BARON NOW'], ['DRAKE', 'DRAKE IN 30'], ['PUSH', 'PUSH MID'], ['BACK', 'RESET AND BACK'], ['PING', 'ON MY WAY'], ['GG', 'GG WP'] ],
    fps: [ ['A SITE', 'ENEMY A SITE'], ['B SITE', 'ENEMY B SITE'], ['ROTATE', 'ROTATE NOW'], ['HOLD', 'HOLD POSITION'], ['ECO', 'ECO NEXT ROUND'], ['GG', 'GG WP'] ],
    creator: [ ['COPY', 'Ctrl+C'], ['PASTE', 'Ctrl+V'], ['UNDO', 'Ctrl+Z'], ['SAVE', 'Ctrl+S'], ['REDO', 'Ctrl+Shift+Z'], ['EXPORT', 'Ctrl+Shift+E'] ]
  };
  const makeProfiles = () => Object.fromEntries(Object.entries(defaults).map(([name, keys]) => [name, keys.map(([label, value]) => ({ label, value, type: name === 'creator' ? 'shortcut' : 'text' }))]));
  const validKey = key => key && typeof key.label === 'string' && key.label.trim().length > 0 && key.label.length <= 12 && typeof key.value === 'string' && key.value.trim().length > 0 && key.value.length <= 160 && ['text', 'shortcut'].includes(key.type);
  let state = { colorway: 'black', profile: 'moba', profiles: makeProfiles() };
  let selectedKey = 0;
  let persistenceAvailable = true;
  const form = document.getElementById('macro-form');
  const labelInput = document.getElementById('key-label');
  const typeInput = document.getElementById('key-type');
  const valueInput = document.getElementById('key-value');
  const feedback = document.getElementById('editor-feedback');
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved) {
      if (['black', 'white'].includes(saved.colorway)) state.colorway = saved.colorway;
      if (Object.hasOwn(defaults, saved.profile)) state.profile = saved.profile;
      for (const profile of Object.keys(defaults)) {
        if (Array.isArray(saved.profiles?.[profile]) && saved.profiles[profile].length === 6 && saved.profiles[profile].every(validKey)) state.profiles[profile] = saved.profiles[profile];
      }
    }
  } catch { persistenceAvailable = false; }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); return true; }
    catch { persistenceAvailable = false; return false; }
  }
  function setColorway(colorway) {
    state.colorway = colorway;
    document.documentElement.dataset.colorway = colorway;
    document.querySelector('meta[name="theme-color"]').content = colorway === 'black' ? '#090A0C' : '#F4F4F0';
    document.querySelectorAll('.brand-image').forEach(img => { img.src = `assets/wordmark-${colorway}.svg`; });
    document.querySelector('.signature').src = colorway === 'black' ? 'assets/signature-q.svg' : 'assets/signature-q-white.svg';
    const product = document.getElementById('product-image');
    product.src = `assets/product-${colorway}.svg`;
    product.alt = `Koncept ${colorway === 'black' ? 'černého' : 'bílého'} makropadu TOXIQ se šesti klávesami BARON, DRAKE, PUSH, BACK, PING a GG.`;
    document.querySelectorAll('[data-colorway]').forEach(button => {
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.colorway === colorway));
    });
  }
  function updateTypeLabel() { document.getElementById('value-label').textContent = typeInput.value === 'text' ? 'Text makra' : 'Klávesová zkratka'; }
  function renderEditor() {
    const key = state.profiles[state.profile][selectedKey];
    document.getElementById('selected-number').textContent = `SELECTED KEY / ${String(selectedKey + 1).padStart(2, '0')}`;
    document.getElementById('selected-label').textContent = key.label;
    labelInput.value = key.label; typeInput.value = key.type; valueInput.value = key.value;
    updateTypeLabel();
  }
  function renderKeys() {
    const grid = document.getElementById('key-grid');
    grid.replaceChildren();
    state.profiles[state.profile].forEach((key, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'key-button'; button.dataset.index = String(index);
      button.setAttribute('aria-pressed', String(index === selectedKey));
      button.setAttribute('aria-label', `Klávesa ${index + 1}: ${key.label}, ${key.type === 'text' ? 'textové makro' : 'klávesová zkratka'}`);
      const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
      const label = document.createElement('strong'); label.textContent = key.label;
      const type = document.createElement('small'); type.textContent = key.type === 'text' ? 'TEXT MACRO' : 'KEY BIND';
      button.append(number, label, type);
      button.addEventListener('click', () => {
        selectedKey = index;
        grid.querySelectorAll('button').forEach((item, i) => item.setAttribute('aria-pressed', String(i === index)));
        renderEditor();
        feedback.textContent = 'Uprav nastavení nebo vyzkoušej stisk.';
      });
      grid.append(button);
    });
  }
  function setProfile(profile) {
    state.profile = profile; selectedKey = 0;
    document.querySelectorAll('[data-profile]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.profile === profile)));
    renderKeys(); renderEditor();
    document.getElementById('macro-output').textContent = 'Your teammates are waiting.';
    feedback.textContent = `Profil ${profile.toUpperCase()} je připravený.`;
  }
  document.querySelectorAll('button[data-colorway]').forEach(button => button.addEventListener('click', () => { setColorway(button.dataset.colorway); persist(); }));
  document.querySelectorAll('[data-profile]').forEach(button => button.addEventListener('click', () => { setProfile(button.dataset.profile); persist(); }));
  document.querySelectorAll('[data-load-profile]').forEach(button => button.addEventListener('click', () => {
    setProfile(button.dataset.loadProfile); persist();
    document.getElementById('makra').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }));
  typeInput.addEventListener('change', updateTypeLabel);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const key = { label: labelInput.value.trim().toUpperCase(), type: typeInput.value, value: valueInput.value.trim() };
    if (!validKey(key)) { feedback.textContent = 'Vyplň název i akci klávesy. Název může mít nejvýše 12 znaků.'; return; }
    state.profiles[state.profile][selectedKey] = key;
    const saved = persist(); renderKeys(); renderEditor();
    feedback.textContent = saved ? 'Uloženo v tomto prohlížeči. Zkus stisk.' : 'Změna platí pro toto otevření. Prohlížeč nepovolil trvalé uložení.';
  });
  document.getElementById('test-key').addEventListener('click', () => {
    const key = state.profiles[state.profile][selectedKey];
    document.getElementById('macro-output').textContent = key.type === 'text' ? key.value : `Zkratka: ${key.value}`;
    const output = document.querySelector('.demo-output');
    output.classList.remove('pulse'); void output.offsetWidth; output.classList.add('pulse');
    feedback.textContent = 'Stisk simulován. Použije se uložená akce klávesy.';
  });
  document.getElementById('export-profile').addEventListener('click', () => {
    const data = { schemaVersion: 1, product: 'TOXIQ web concept', profile: state.profile, keys: state.profiles[state.profile] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `toxiq-${state.profile}.json`; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback.textContent = 'Profil byl exportován jako JSON.';
  });
  document.getElementById('reset-profile').addEventListener('click', () => {
    state.profiles[state.profile] = makeProfiles()[state.profile];
    setProfile(state.profile); const saved = persist();
    feedback.textContent = saved ? 'Aktuální profil byl obnoven na ukázkové hodnoty.' : 'Profil obnoven pro toto otevření. Trvalé uložení není dostupné.';
  });
  setColorway(state.colorway); setProfile(state.profile);
  feedback.textContent = persistenceAvailable ? 'Změny se ukládají jen v tomto prohlížeči.' : 'Trvalé uložení není dostupné. Demo funguje pro toto otevření.';
  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
