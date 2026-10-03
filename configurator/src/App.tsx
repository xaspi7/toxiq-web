import { useEffect, useRef, useState } from 'react';
import {
  ACTION_TYPES, PROFILE_IDS, MEDIA, MOUSE, KEY_CODES, STORAGE_KEY, THEME_KEY,
  makeDefaultConfig, parseConfig, actionError, configError, defaultAction, summary, captureHotkey,
} from './config.ts';
import type { Config, KeyAction, Theme } from './config.ts';
import type { CSSProperties } from 'react';
import { MockDevice } from './device/device.ts';
import { UsbDevice } from './device/usb.ts';
import type { DeviceInfo, Port } from './device/usb.ts';
import { Icon } from './Icon.tsx';
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
  const [device] = useState(() => window.toxiq ? new UsbDevice(window.toxiq) : new MockDevice());
  const isUsb = device.kind === 'usb';
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [reading, setReading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [ports, setPorts] = useState<Port[]>([]);
  const [portPath, setPortPath] = useState('');
  const [pressedKeys, setPressedKeys] = useState<number[]>([]);
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
  const actionDrafts = useRef(new Map<string, string>());

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
  useEffect(() => {
    if (!(device instanceof UsbDevice)) return;
    let cancelled = false;
    async function refreshPorts() {
      try { const found = await (device as UsbDevice).list(); if (!cancelled) setPorts(found); }
      catch { if (!cancelled) setPorts([]); }
    }
    void refreshPorts();
    const timer = setInterval(() => void refreshPorts(), 2000);
    const unsubscribe = device.subscribe(event => {
      if (event.type === 'disconnected') { setConnected(false); setDeviceInfo(null); setPressedKeys([]); setSavedSnapshot(''); setSaveNotice(event.message); }
      else setPressedKeys(previous => event.pressed ? [...new Set([...previous, event.key])] : previous.filter(key => key !== event.key));
    });
    return () => { cancelled = true; clearInterval(timer); unsubscribe(); };
  }, [device]);
  useEffect(() => { if (!ports.some(port => port.path === portPath)) setPortPath(ports[0]?.path || ''); }, [ports, portPath]);

  function updateKey(update: Partial<KeyAction>) {
    setSaveNotice('');
    setConfig(previous => {
      const next = structuredClone(previous);
      Object.assign(next.profiles[next.activeProfile].keys[selected], update);
      return next;
    });
  }
  function selectKey(index: number) { setSelected(index); setCapturing(false); }
  function switchAction(type: KeyAction['type']) {
    if (type === key.type) return;
    const scope = `${config.activeProfile}:${selected}`;
    actionDrafts.current.set(`${scope}:${key.type}`, key.value);
    updateKey({ type, value: actionDrafts.current.get(`${scope}:${type}`) ?? defaultAction(type) });
    setCapturing(false);
  }
  async function toggleDevice() {
    if (connecting) return;
    setConnecting(true); setSaveNotice('');
    try {
      if (device.connected) { await device.disconnect(); setSavedSnapshot(''); setDeviceInfo(null); setPressedKeys([]); }
      else if (device instanceof UsbDevice) {
        const path = portPath || (await device.list())[0]?.path;
        if (!path) throw new Error('XIAO není připojené. Připoj USB kabel a nahraj TOXIQ firmware v0.4.');
        const stored = await device.connect(path);
        setDeviceInfo(device.info); setSavedSnapshot(JSON.stringify(stored));
        setSaveNotice('Připojeno. Můžeš načíst nastavení zařízení nebo zapsat své změny.');
      } else await device.connect();
      setConnected(device.connected);
    } catch (error) { setConnected(false); setNotice(error instanceof Error ? error.message : 'USB připojení selhalo.'); }
    finally { setConnecting(false); }
  }
  async function readFromDevice() {
    if (!(device instanceof UsbDevice) || reading || saving) return;
    const draftAtStart = JSON.stringify(configRef.current);
    setReading(true);
    try {
      const stored = await device.readConfig();
      setSavedSnapshot(JSON.stringify(stored));
      if (JSON.stringify(configRef.current) !== draftAtStart) { setNotice('Během načítání jsi upravil nastavení. Změny zůstaly zachované; načti zařízení znovu.'); return; }
      // Preserve the previous local draft before explicitly replacing it.
      try { localStorage.setItem('toxiq.configurator.before-device-read', draftAtStart); }
      catch { throw new Error('Rozpracované nastavení nelze zálohovat. Nejdřív ho exportuj.'); }
      actionDrafts.current.clear(); setConfig(stored); selectKey(0); setStorageBlocked(false); setSaveNotice('Načteno ze zařízení.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Načítání selhalo.'); }
    finally { setReading(false); }
  }
  async function saveToDevice() {
    if (saving || reading || configError(config)) return;
    const snapshot = structuredClone(config);
    setSaving(true); setSaveNotice('');
    try {
      await device.saveConfig(snapshot);
      setSavedSnapshot(JSON.stringify(snapshot));
      setSaveNotice(JSON.stringify(configRef.current) === JSON.stringify(snapshot) ? (isUsb ? 'Uloženo v zařízení. Zápis ověřen.' : 'Uloženo do demo zařízení.') : 'Uloženo. Nové změny ještě čekají.');
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
      actionDrafts.current.clear(); setConfig(imported); setSelected(0); setCapturing(false); setStorageBlocked(false); setSaveNotice('');
      setNotice('Profily byly importovány.');
    } catch (error) { setNotice(error instanceof SyntaxError ? 'Soubor neobsahuje platný JSON.' : error instanceof Error ? error.message : 'Import selhal.'); }
  }

  return <div className="desktop-app">
    <a className="skip-link" href="#workspace">Přejít na klávesy</a>
    <header className="app-chrome">
      <div className="app-brand"><span className="asset-pair wordmark"><img data-variant="black" src={darkWordmark} alt="TOXIQ" /><img data-variant="white" src={lightWordmark} alt="TOXIQ" /></span><span className="app-name">Configurator</span></div>
      <span className="demo-label" title={isUsb ? 'Konfigurace zařízení přes USB' : 'Lokální náhled bez hardwaru'}>{isUsb ? 'USB' : 'DEMO'}</span>
    </header>

    <div className="app-body">
      <aside className="sidebar" aria-label="Profily a zařízení">
        <p className="sidebar-label">Profily</p>
        <div className="profile-options" role="group" aria-label="Profily">
          {PROFILE_IDS.map(id => <button className="profile-button" type="button" key={id} aria-pressed={config.activeProfile === id} onClick={() => { setConfig(previous => ({ ...previous, activeProfile: id })); selectKey(0); setSaveNotice(''); }}><Icon name={id} /><span>{config.profiles[id].name}</span></button>)}
        </div>
        <div className="sidebar-bottom">
          <div className="theme-switch" role="group" aria-label="Vzhled">
            <button type="button" aria-label="Black / Lime" aria-pressed={theme === 'black'} onClick={() => setTheme('black')}><Icon name="moon" /><span>Black</span></button>
            <button type="button" aria-label="White / Violet" aria-pressed={theme === 'white'} onClick={() => setTheme('white')}><Icon name="sun" /><span>White</span></button>
          </div>
          {isUsb && !connected && ports.length > 1 && <select className="port-select" aria-label="USB zařízení" value={portPath} onChange={event => setPortPath(event.target.value)}>{ports.map(port => <option key={port.path} value={port.path}>{port.label}</option>)}</select>}
          <button className="device-control" type="button" disabled={connecting || reading || saving} aria-label={isUsb ? connected ? 'Odpojit zařízení' : 'Připojit USB zařízení' : connected ? 'Odpojit demo' : 'Připojit demo zařízení'} aria-pressed={connected} onClick={() => void toggleDevice()}><Icon name="plug" /><span className="device-state"><strong>{isUsb ? 'TOXIQ USB' : 'Demo'}</strong><span>{connecting ? 'Připojuji…' : connected ? 'Připojeno' : isUsb && ports.length ? 'Připraveno' : 'Odpojeno'}</span></span><span className="toggle-track" aria-hidden="true"><span /></span></button>
          {isUsb && <button className="tool-button" type="button" disabled={!connected || reading || saving} onClick={() => void readFromDevice()}><Icon name="download" /><span>{reading ? 'Načítám…' : 'Načíst ze zařízení'}</span></button>}
        </div>
      </aside>

      <main className="workspace" id="workspace">
        <div className="workspace-toolbar"><div><h1>{profile.name}</h1><span>Klávesy</span></div><div className="file-actions"><button className="tool-button" type="button" onClick={() => importInput.current?.click()}><Icon name="download" /><span>Import</span></button><button className="tool-button" type="button" onClick={exportConfig}><Icon name="upload" /><span>Export</span></button><input ref={importInput} type="file" accept=".json,application/json" hidden aria-label="Import profilů" onChange={event => { void importConfig(event.target.files?.[0]); event.target.value = ''; }} /></div></div>
        <div className="device-stage">
          <div className="pad-shell" key={config.activeProfile} style={{ '--brightness': deviceInfo?.brightness === false ? 0 : config.brightness / 100 } as CSSProperties}>
            <div className="key-grid" role="group" aria-label="Klávesy TOXIQ, rozložení 3 krát 2">
              {profile.keys.map((action, index) => <button type="button" className="macro-key" key={index} data-key-index={index} data-physical={deviceInfo ? index < deviceInfo.physicalKeys : undefined} data-hardware-pressed={pressedKeys.includes(index)} tabIndex={selected === index ? 0 : -1} aria-pressed={selected === index} title={deviceInfo && index >= deviceInfo.physicalKeys ? 'Připraveno pro budoucí tlačítko' : undefined} aria-label={`Klávesa ${index + 1}: ${action.label || 'bez názvu'}, ${displayType[action.type]}, ${summary(action)}`} onClick={() => selectKey(index)} onKeyDown={event => {
                const target = ({ ArrowLeft: Math.max(0, index - 1), ArrowRight: Math.min(5, index + 1), ArrowUp: Math.max(0, index - 3), ArrowDown: Math.min(5, index + 3), Home: 0, End: 5 } as Record<string, number>)[event.key];
                if (target === undefined) return;
                event.preventDefault(); selectKey(target); (event.currentTarget.parentElement?.querySelector(`[data-key-index="${target}"]`) as HTMLElement | null)?.focus();
              }}><span className="key-face"><span className="key-topline"><span>{String(index + 1).padStart(2, '0')}</span><Icon name={action.type} /></span><strong>{action.label || '—'}</strong><small>{summary(action)}</small></span></button>)}
            </div>
            <div className="pad-mark"><span className="asset-pair signature"><img data-variant="black" src={darkQ} alt="" /><img data-variant="white" src={lightQ} alt="" /></span></div>
          </div>
        </div>
        <div className="lighting"><Icon name="sun" /><label htmlFor="brightness">Podsvícení</label><input id="brightness" type="range" min="0" max="100" step="1" disabled={deviceInfo?.brightness === false} value={config.brightness} onChange={event => { setConfig(previous => ({ ...previous, brightness: Number(event.target.value) })); setSaveNotice(''); }} /><output htmlFor="brightness">{deviceInfo?.brightness === false ? 'Bez LED' : `${config.brightness}%`}</output></div>
      </main>

      <section className="inspector" aria-labelledby="selected-heading">
        <div className="inspector-heading"><span className="selected-key-badge">{String(selected + 1).padStart(2, '0')}</span><h2 id="selected-heading">Klávesa {String(selected + 1).padStart(2, '0')}</h2></div>
        <div className="inspector-scroll" key={`${config.activeProfile}:${selected}`}>
          <div className="editor-field"><label htmlFor="key-label">Název</label><input id="key-label" type="text" maxLength={12} autoComplete="off" value={key.label} onChange={event => updateKey({ label: event.target.value.toUpperCase() })} /></div>
          <fieldset className="action-field"><legend>Akce</legend><div className="action-types">{ACTION_TYPES.map(type => <button type="button" key={type} aria-pressed={key.type === type} onClick={() => switchAction(type)}><Icon name={type} /><span>{displayType[type]}</span></button>)}</div></fieldset>
          <div className="editor-field action-value">
            {key.type === 'text' && <><label htmlFor="action-value">Text k odeslání</label><textarea id="action-value" rows={4} maxLength={240} placeholder="Napiš zprávu…" value={key.value} aria-invalid={Boolean(error)} aria-describedby="key-error" onChange={event => updateKey({ value: event.target.value })} /><p className="character-count">{isUsb && <span>Bez diakritiky · rozložení US</span>}<span className="count">{key.value.length} / 240</span></p></>}
            {key.type === 'hotkey' && <><label htmlFor="action-value">Zkratka</label><input ref={captureInput} id="action-value" className={capturing ? 'recording' : ''} type="text" autoComplete="off" maxLength={40} value={capturing ? '' : key.value} placeholder={capturing ? 'Stiskni zkratku…' : 'CTRL+SHIFT+M'} readOnly={capturing} aria-invalid={Boolean(error)} aria-describedby="key-error" onChange={event => updateKey({ value: event.target.value.toUpperCase().replaceAll(' ', '') })} onKeyDown={event => { if (!capturing) return; event.preventDefault(); if (event.code === 'Escape') { setCapturing(false); return; } const value = captureHotkey(event.nativeEvent); if (value) { updateKey({ value }); setCapturing(false); } }} onBlur={() => setCapturing(false)} /><button className={`record-button ${capturing ? 'is-recording' : ''}`} type="button" onMouseDown={event => event.preventDefault()} onClick={() => setCapturing(value => !value)}><Icon name={capturing ? 'close' : 'record'} /><span>{capturing ? 'Zrušit záznam' : 'Zaznamenat zkratku'}</span></button></>}
            {key.type === 'key' && <><label htmlFor="action-value">Klávesa</label><div className="select-wrap"><select id="action-value" value={key.value} onChange={event => updateKey({ value: event.target.value })}>{KEY_CODES.map(value => <option key={value}>{value}</option>)}</select><Icon name="chevron" /></div></>}
            {(key.type === 'media' || key.type === 'mouse') && <><label htmlFor="action-value">{key.type === 'media' ? 'Ovládání médií' : 'Akce myši'}</label><div className="select-wrap"><select id="action-value" value={key.value} onChange={event => updateKey({ value: event.target.value })}>{Object.entries(key.type === 'media' ? MEDIA : MOUSE).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Icon name="chevron" /></div></>}
            {error && <p id="key-error" className="key-error" role="status">{error}</p>}
          </div>
        </div>
        <div className="save-zone"><p className="save-status" role="status">{saveNotice || (fullError && !error ? fullError : !connected ? isUsb ? 'Připoj TOXIQ přes USB.' : 'Připoj demo pro zkoušku zápisu.' : isSavedToDemo ? isUsb ? 'Zařízení je aktuální.' : 'Demo je aktuální.' : 'Změny čekají na zápis.')}</p><button type="button" className="save-button" disabled={!connected || saving || reading || Boolean(fullError)} onClick={() => void saveToDevice()}><Icon name={isSavedToDemo ? 'check' : 'save'} /><span>{saving ? 'Ukládám…' : isUsb ? 'Uložit do zařízení' : 'Uložit do dema'}</span></button></div>
      </section>
    </div>
    <footer className="statusbar"><span><Icon name="info" />{isUsb ? deviceInfo ? `V0 · ${deviceInfo.physicalKeys} tlačítka · FW ${deviceInfo.firmware}` : 'USB · zařízení odpojeno' : 'Demo · bez hardwaru'}</span><span role="status"><Icon name={storageStatus === 'Uloženo lokálně' ? 'check' : 'info'} />{storageStatus}</span></footer>
    {notice && <div className="notice" role="status"><Icon name="info" /><p>{notice}</p><button className="icon-button" type="button" aria-label="Zavřít oznámení" onClick={() => setNotice('')}><Icon name="close" /></button></div>}
  </div>;
}
