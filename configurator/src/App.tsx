import { useEffect, useRef, useState } from 'react';
import {
  ACTION_TYPES, PROFILE_IDS, MEDIA, MOUSE, KEY_CODES, STORAGE_KEY, THEME_KEY,
  makeDefaultConfig, parseConfig, actionError, configError, defaultAction, summary, captureHotkey,
} from './config.ts';
import type { Config, KeyAction, Theme } from './config.ts';
import { MockDevice } from './device/device.ts';
import darkWordmark from '../../assets/wordmark-black.svg';
import lightWordmark from '../../assets/wordmark-white.svg';
import darkQ from '../../assets/signature-q.svg';
import lightQ from '../../assets/signature-q-white.svg';

function readInitial(): { config: Config; notice: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const legacy = raw ? null : localStorage.getItem('toxiq-config-v01');
    if (raw || legacy) return { config: parseConfig(JSON.parse((raw || legacy)!), { allowDraft: true, legacy: Boolean(legacy) }), notice: legacy ? 'Načteno nastavení z v0.1.' : '' };
  } catch { return { config: makeDefaultConfig(), notice: 'Uložené nastavení nešlo načíst. Původní data zůstala beze změny; exportuj si nové nastavení před zavřením.' }; }
  return { config: makeDefaultConfig(), notice: '' };
}
function readTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    const website = JSON.parse(localStorage.getItem('toxiq.concept.v1') || 'null');
    return value === 'white' || (!value && website?.colorway === 'white') ? 'white' : 'black';
  } catch { return 'black'; }
}
const displayType: Record<KeyAction['type'], string> = { key: 'Klávesa', hotkey: 'Zkratka', text: 'Text', media: 'Média', mouse: 'Myš' };

export function App() {
  const [initial] = useState(readInitial);
  const [config, setConfig] = useState(initial.config);
  const [theme, setTheme] = useState(readTheme);
  const [selected, setSelected] = useState(0);
  const [device] = useState(() => new MockDevice());
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [notice, setNotice] = useState(initial.notice);
  const [storageStatus, setStorageStatus] = useState('');
  const [storageBlocked, setStorageBlocked] = useState(Boolean(initial.notice && !initial.notice.includes('v0.1')));
  const [capturing, setCapturing] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const captureInput = useRef<HTMLInputElement>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const profile = config.profiles[config.activeProfile];
  const key = profile.keys[selected];
  const error = actionError(key);
  const fullError = configError(config);
  const isSavedToDemo = savedSnapshot === JSON.stringify(config);
  const desktop = window.location.protocol === 'file:';

  useEffect(() => {
    if (storageBlocked) { setStorageStatus('Automatické ukládání pozastaveno.'); return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); setStorageStatus('Uloženo lokálně'); }
    catch { setStorageStatus('Lokální úložiště není dostupné. Použij export.'); }
  }, [config, storageBlocked]);
  useEffect(() => {
    document.documentElement.dataset.colorway = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'black' ? '#090A0C' : '#F4F4F0');
    try {
      localStorage.setItem(THEME_KEY, theme);
      const existing = JSON.parse(localStorage.getItem('toxiq.concept.v1') || '{}');
      localStorage.setItem('toxiq.concept.v1', JSON.stringify({ ...existing, colorway: theme }));
    } catch { /* A theme still works without persistent storage. */ }
  }, [theme]);
  useEffect(() => { if (capturing) captureInput.current?.focus(); }, [capturing]);

  function updateKey(update: Partial<KeyAction>) {
    setSaveNotice('');
    setConfig(previous => {
      const next = structuredClone(previous);
      Object.assign(next.profiles[next.activeProfile].keys[selected], update);
      return next;
    });
  }
  function selectKey(index: number) { setSelected(index); setCapturing(false); }
  async function toggleDevice() {
    if (device.connected) { device.disconnect(); setSavedSnapshot(''); }
    else await device.connect();
    setConnected(device.connected);
    setSaveNotice('');
  }
  async function saveToDemo() {
    if (saving || configError(config)) return;
    const snapshot = structuredClone(config);
    setSaving(true); setSaveNotice('');
    try {
      await device.saveConfig(snapshot);
      setSavedSnapshot(JSON.stringify(snapshot));
      setSaveNotice(JSON.stringify(configRef.current) === JSON.stringify(snapshot) ? 'Uloženo do demo zařízení.' : 'Demo uloženo. Nové změny ještě čekají.');
    } catch (error) { setSaveNotice(error instanceof Error ? error.message : 'Ukládání selhalo.'); }
    finally { setSaving(false); }
  }
  function exportConfig() {
    if (fullError) { setNotice(fullError); return; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(config, null, 2) + '\n'], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'toxiq-profiles.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Profily byly exportovány.');
  }
  async function importConfig(file?: File) {
    if (!file) return;
    try {
      if (file.size > 64 * 1024) throw new Error('Soubor je příliš velký. Maximum je 64 kB.');
      const imported = parseConfig(JSON.parse(await file.text()));
      setConfig(imported); setSelected(0); setCapturing(false); setStorageBlocked(false); setSaveNotice('');
      setNotice('Profily byly importovány.');
    } catch (error) { setNotice(error instanceof SyntaxError ? 'Soubor neobsahuje platný JSON.' : error instanceof Error ? error.message : 'Import selhal.'); }
  }

  return <div className="app-shell">
    <a className="skip-link" href="#workspace">Přejít na nastavení kláves</a>
    <header className="topbar">
      <div className="brand-line">
        <span className="asset-pair wordmark"><img data-variant="black" src={darkWordmark} alt="TOXIQ" /><img data-variant="white" src={lightWordmark} alt="TOXIQ" /></span>
        <span className="app-label">CONFIGURATOR <span>V0.2</span></span>
      </div>
      <p className="device-state"><span className={connected ? 'connected' : ''}>{connected ? 'DEMO PŘIPOJENO' : 'LOKÁLNÍ REŽIM'}</span><span>Bez připojení k hardwaru</span></p>
      <div className="top-actions">
        {!desktop && <a href="../">Produktový web</a>}
        <div className="theme-switch" role="group" aria-label="Barevná varianta">
          <button type="button" aria-pressed={theme === 'black'} onClick={() => setTheme('black')}>Black<span>Lime</span></button>
          <button type="button" aria-pressed={theme === 'white'} onClick={() => setTheme('white')}>White<span>Violet</span></button>
        </div>
      </div>
    </header>

    <main>
      <div className="workspace-heading"><h1>YOUR KEYS. <span>YOUR CALLS.</span></h1><p role="status">{storageStatus}</p></div>
      <div className="profile-bar">
        <div className="profile-options" role="group" aria-label="Profily">
          {PROFILE_IDS.map((id, index) => <button type="button" key={id} aria-pressed={config.activeProfile === id} onClick={() => { setConfig(previous => ({ ...previous, activeProfile: id })); selectKey(0); setSaveNotice(''); }}><span>{String(index + 1).padStart(2, '0')}</span>{config.profiles[id].name}</button>)}
        </div>
        <div className="file-actions"><button type="button" onClick={() => importInput.current?.click()}>Import</button><button type="button" onClick={exportConfig}>Export</button><input ref={importInput} type="file" accept=".json,application/json" hidden aria-label="Import profilů" onChange={event => { void importConfig(event.target.files?.[0]); event.target.value = ''; }} /></div>
      </div>

      {notice && <div className="notice" role="status"><p>{notice}</p><button type="button" aria-label="Zavřít oznámení" onClick={() => setNotice('')}>Zavřít</button></div>}
      <section className="workspace" id="workspace" aria-label="Nastavení kláves">
        <div className="pad-area">
          <div className="pad-heading"><p className="eyebrow">{profile.name} / 06 KEYS</p><p>Vyber klávesu.</p></div>
          <div className="pad-shell" role="group" aria-label="Klávesy TOXIQ, rozložení 3 krát 2">
            {profile.keys.map((action, index) => <button type="button" className="macro-key" key={index} aria-pressed={selected === index} aria-label={`Klávesa ${index + 1}: ${action.label || 'bez názvu'}, ${displayType[action.type]}, ${summary(action)}`} onClick={() => selectKey(index)}>
              <span className="key-topline"><span>{String(index + 1).padStart(2, '0')}</span><span>{action.type.toUpperCase()}</span></span>
              <strong>{action.label || '—'}</strong><small>{summary(action)}</small>
            </button>)}
          </div>
          <div className="pad-caption"><p>3 × 2 / PHYSICAL LAYOUT</p><span className="asset-pair signature"><img data-variant="black" src={darkQ} alt="" /><img data-variant="white" src={lightQ} alt="" /></span></div>
          <div className="lighting">
            <div className="field-inline"><label htmlFor="brightness">UNDERGLOW</label><output htmlFor="brightness">{config.brightness}%</output></div>
            <input id="brightness" type="range" min="0" max="100" step="1" value={config.brightness} onChange={event => { setConfig(previous => ({ ...previous, brightness: Number(event.target.value) })); setSaveNotice(''); }} />
            <p>Jas bílé podsvícené základny. V demu se ukládá jen nastavení.</p>
          </div>
          <p className="prototype-note">Prototyp V0 má zapojené klávesy 01 a 02. Tady připravíš přiřazení pro všech šest.</p>
        </div>

        <div className="editor" aria-labelledby="selected-heading">
          <div className="editor-heading"><p className="eyebrow">SELECTED KEY / {String(selected + 1).padStart(2, '0')}</p><h2 id="selected-heading">{key.label || 'YOUR KEY'}</h2></div>
          <div className="editor-field"><label htmlFor="key-label">NÁZEV KLÁVESY</label><input id="key-label" type="text" maxLength={12} autoComplete="off" value={key.label} onChange={event => updateKey({ label: event.target.value.toUpperCase() })} /></div>
          <fieldset className="action-field"><legend>AKCE</legend><div className="action-types">{ACTION_TYPES.map(type => <button type="button" key={type} aria-pressed={key.type === type} onClick={() => { if (key.type !== type) { updateKey({ type, value: defaultAction(type) }); setCapturing(false); } }}>{type.toUpperCase()}</button>)}</div></fieldset>
          <div className="editor-field action-value">
            {key.type === 'text' && <><label htmlFor="action-value">TEXT K ODESLÁNÍ</label><textarea id="action-value" rows={3} maxLength={240} value={key.value} aria-invalid={Boolean(error)} aria-describedby="action-help key-error" onChange={event => updateKey({ value: event.target.value })} /><div className="text-meta"><p id="action-help">Textové makro.</p><span>{key.value.length} / 240</span></div></>}
            {key.type === 'hotkey' && <><div className="field-inline"><label htmlFor="action-value">KLÁVESOVÁ ZKRATKA</label><button type="button" className="capture-button" onClick={() => setCapturing(value => !value)}>{capturing ? 'Zrušit záznam' : 'Zaznamenat'}</button></div><input ref={captureInput} id="action-value" type="text" autoComplete="off" maxLength={40} value={capturing ? '' : key.value} placeholder={capturing ? 'Stiskni zkratku…' : 'CTRL+SHIFT+M'} readOnly={capturing} aria-invalid={Boolean(error)} aria-describedby="action-help key-error" onChange={event => updateKey({ value: event.target.value.toUpperCase().replaceAll(' ', '') })} onKeyDown={event => { if (!capturing) return; event.preventDefault(); if (event.code === 'Escape') { setCapturing(false); return; } const value = captureHotkey(event.nativeEvent); if (value) { updateKey({ value }); setCapturing(false); } }} onBlur={() => setCapturing(false)} /><p id="action-help" className="helper">CTRL, ALT, SHIFT nebo META + jedna klávesa. Escape záznam zruší.</p></>}
            {key.type === 'key' && <><label htmlFor="action-value">KLÁVESA</label><select id="action-value" value={key.value} onChange={event => updateKey({ value: event.target.value })}>{KEY_CODES.map(value => <option key={value}>{value}</option>)}</select><p className="helper">Jeden standardní klávesový vstup.</p></>}
            {(key.type === 'media' || key.type === 'mouse') && <><label htmlFor="action-value">{key.type === 'media' ? 'OVLÁDÁNÍ MÉDIÍ' : 'AKCE MYŠI'}</label><select id="action-value" value={key.value} onChange={event => updateKey({ value: event.target.value })}>{Object.entries(key.type === 'media' ? MEDIA : MOUSE).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p className="helper">{key.type === 'media' ? 'Standardní ovládání zvuku a přehrávání.' : 'Kliknutí nebo posun kolečka.'}</p></>}
            <p id="key-error" className="key-error" role="status">{error || ''}</p>
          </div>
          <div className="save-zone">
            <button type="button" className="save-button" disabled={!connected || saving || Boolean(fullError)} onClick={() => void saveToDemo()}>{saving ? 'SAVING…' : 'SAVE TO TOXIQ'}</button>
            <p className="save-status" role="status">{saveNotice || (fullError ? fullError : !connected ? 'Změny zůstávají lokálně. Pro zkoušku ukládání připoj demo.' : isSavedToDemo ? 'Demo má aktuální nastavení.' : 'Změny čekají na uložení do dema.')}</p>
            <button type="button" className="demo-toggle" onClick={() => void toggleDevice()}>{connected ? 'Odpojit demo' : 'Připojit demo zařízení'}</button>
          </div>
        </div>
      </section>
    </main>
    <footer className="app-footer"><p>TOXIQ CONFIGURATOR / V0.2</p><p>Konfigurace se ukládá v tomto {desktop ? 'počítači' : 'prohlížeči'}. USB přenos zatím není zapojený.</p></footer>
  </div>;
}
