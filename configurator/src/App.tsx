import { useEffect, useRef, useState } from 'react';
import {
  ACTION_TYPES, PROFILE_IDS, MEDIA, MOUSE, KEY_CODES, STORAGE_KEY, THEME_KEY, TEXT_LAYOUTS,
  makeDefaultConfig, parseConfig, actionError, configError, defaultAction, summary, captureHotkey,
} from './config.ts';
import type { Config, KeyAction, Theme, TextLayout } from './config.ts';
import type { CSSProperties } from 'react';
import { MockDevice } from './device/device.ts';
import { UsbDevice } from './device/usb.ts';
import type { DeviceInfo, Port } from './device/usb.ts';
import { Icon } from './Icon.tsx';
import { LANGUAGE_KEY, readLanguage, translate, errorText } from './i18n.ts';
import type { Language, MessageKey } from './i18n.ts';
import darkWordmark from '../../assets/wordmark-black.svg';
import lightWordmark from '../../assets/wordmark-white.svg';
import darkQ from '../../assets/signature-q.svg';
import lightQ from '../../assets/signature-q-white.svg';

function readInitial(): { config: Config; notice: string; fresh: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const legacy = raw ? null : localStorage.getItem('toxiq-config-v01');
    if (raw || legacy) return { config: parseConfig(JSON.parse((raw || legacy)!), { allowDraft: true, legacy: Boolean(legacy) }), notice: legacy ? 'migrated' : '', fresh: JSON.parse((raw || legacy)!).version !== 2 };
  } catch { return { config: makeDefaultConfig(), notice: 'local_corrupt', fresh: false }; }
  return { config: makeDefaultConfig(), notice: '', fresh: true };
}
function readTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    const website = JSON.parse(localStorage.getItem('toxiq.concept.v1') || 'null');
    return value === 'white' || (!value && website?.colorway === 'white') ? 'white' : 'black';
  } catch { return 'black'; }
}
const typeMessage: Record<KeyAction['type'], MessageKey> = { key: 'key_type', hotkey: 'hotkey_type', text: 'text_type', media: 'media_type', mouse: 'mouse_type' };

export function App() {
  const [initial] = useState(readInitial);
  const [config, setConfig] = useState(initial.config);
  const [theme, setTheme] = useState(readTheme);
  const [language, setLanguage] = useState<Language>(readLanguage);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const t = (id: MessageKey) => translate(id, language);
  const displayError = (value: string) => errorText(value, language);
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
  const [storageStatus, setStorageStatus] = useState('draft_saved');
  const [storageBlocked, setStorageBlocked] = useState(initial.notice === 'local_corrupt');
  const [capturing, setCapturing] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const captureInput = useRef<HTMLInputElement>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const profile = config.profiles[config.activeProfile];
  const key = profile.keys[selected];
  const error = actionError(key, config.textLayout);
  const fullError = configError(config);
  const isSavedToDemo = savedSnapshot === JSON.stringify(config);
  const actionDrafts = useRef(new Map<string, string>());

  useEffect(() => {
    if (storageBlocked) { setStorageStatus('storage_paused'); return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); setStorageStatus('draft_saved'); }
    catch { setStorageStatus('storage_failed'); }
  }, [config, storageBlocked]);
  useEffect(() => {
    document.documentElement.dataset.colorway = theme;
    document.documentElement.dataset.platform = window.toxiq?.platform || 'browser';
    void window.toxiq?.setTheme?.(theme).catch(() => {});
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

  useEffect(() => {
    document.documentElement.lang = language;
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Optional preference. */ }
  }, [language]);
  useEffect(() => {
    if (!initial.fresh || !window.toxiq?.keyboardLayout) return;
    const start = JSON.stringify(configRef.current);
    let cancelled = false;
    void window.toxiq.keyboardLayout().then(layout => {
      if (!cancelled && layout && JSON.stringify(configRef.current) === start) setConfig(previous => ({ ...previous, textLayout: layout }));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [initial.fresh]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [menuOpen]);

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
    if (connecting || reading || saving) return;
    setConnecting(true); setSaveNotice('');
    try {
      if (device.connected) { await device.disconnect(); setSavedSnapshot(''); setDeviceInfo(null); setPressedKeys([]); }
      else if (device instanceof UsbDevice) {
        const path = portPath || (await device.list())[0]?.path;
        if (!path) throw new Error('no_device');
        const stored = await device.connect(path);
        setDeviceInfo(device.info); setSavedSnapshot(JSON.stringify(stored));
        setSaveNotice('connected_notice');
      } else await device.connect();
      setConnected(device.connected);
    } catch (error) { setConnected(false); setNotice(error instanceof Error ? error.message : 'usb_failed'); }
    finally { setConnecting(false); }
  }
  async function readFromDevice() {
    if (!(device instanceof UsbDevice) || reading || saving) return;
    const draftAtStart = JSON.stringify(configRef.current);
    setReading(true);
    try {
      const stored = await device.readConfig();
      setSavedSnapshot(JSON.stringify(stored));
      if (JSON.stringify(configRef.current) !== draftAtStart) { setNotice('edited_during_read'); return; }
      // Preserve the previous local draft before explicitly replacing it.
      try { localStorage.setItem('toxiq.configurator.before-device-read', draftAtStart); }
      catch { throw new Error('backup_failed'); }
      actionDrafts.current.clear(); setConfig(stored); selectKey(0); setStorageBlocked(false); setSaveNotice('read_notice');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'operation_failed'); }
    finally { setReading(false); }
  }
  async function saveToDevice() {
    if (connecting || saving || reading || configError(config)) return;
    const snapshot = structuredClone(config);
    setSaving(true); setSaveNotice('');
    try {
      await device.saveConfig(snapshot);
      setSavedSnapshot(JSON.stringify(snapshot));
      setSaveNotice(JSON.stringify(configRef.current) === JSON.stringify(snapshot) ? (isUsb ? 'saved' : 'saved_demo') : 'new_changes');
    } catch (error) { setSaveNotice(error instanceof Error ? error.message : 'operation_failed'); }
    finally { setSaving(false); }
  }
  function exportConfig() {
    if (fullError) { setNotice(fullError); return; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(config, null, 2) + '\n'], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'toxiq-profiles.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('exported');
  }
  async function importConfig(file?: File) {
    if (!file) return;
    try {
      if (file.size > 64 * 1024) throw new Error('file_large');
      const imported = parseConfig(JSON.parse(await file.text()));
      try { localStorage.setItem('toxiq.configurator.before-import', JSON.stringify(configRef.current)); } catch { throw new Error('backup_failed'); }
      actionDrafts.current.clear(); setConfig(imported); setSelected(0); setCapturing(false); setStorageBlocked(false); setSaveNotice('');
      setNotice('imported');
    } catch (error) { setNotice(error instanceof SyntaxError ? 'json_invalid' : error instanceof Error ? error.message : 'operation_failed'); }
  }

  return <div className="desktop-app">
    <a className="skip-link" href="#workspace">{t('skip')}</a>
    <header className="app-chrome">
      <div className="app-brand"><span className="asset-pair wordmark"><img data-variant="black" src={darkWordmark} alt="TOXIQ" /><img data-variant="white" src={lightWordmark} alt="TOXIQ" /></span><span className="app-name">Configurator</span></div>
      <div className="chrome-actions"><select className="language-select" aria-label={t('language')} value={language} onChange={event => setLanguage(event.target.value as Language)}><option value="en">EN</option><option value="cs">CZ</option></select><button className="icon-button" type="button" aria-label={t('theme')} title={t('theme')} onClick={() => setTheme(theme === 'black' ? 'white' : 'black')}><Icon name={theme === 'black' ? 'sun' : 'moon'} /></button></div>
    </header>
    <div className="workspace-toolbar">
      <div className="profile-options" role="group" aria-label={t('profiles')}>{PROFILE_IDS.map(id => <button className="profile-button" type="button" key={id} aria-pressed={config.activeProfile === id} onClick={() => { setConfig(previous => ({ ...previous, activeProfile: id })); selectKey(0); setSaveNotice(''); }}><Icon name={id} /><span>{config.profiles[id].name}</span></button>)}</div>
      <div className="connection-actions">
        {isUsb && !connected && ports.length > 1 && <select className="port-select" aria-label="USB" value={portPath} onChange={event => setPortPath(event.target.value)}>{ports.map(port => <option key={port.path} value={port.path}>{port.label}</option>)}</select>}
        {connected ? <span className="connection-state"><span className="status-dot" />{isUsb ? 'TOXIQ V0' : 'DEMO'}</span> : <button className="connect-button" type="button" disabled={connecting || reading || saving} onClick={() => void toggleDevice()}><Icon name="plug" /><span>{connecting ? t('connecting') : isUsb ? t('connect') : t('connect_demo')}</span></button>}
        <div className="more-menu" ref={menuRef}><button className="icon-button" type="button" aria-label={t('more')} aria-expanded={menuOpen} aria-controls="file-menu" ref={menuButton} onClick={() => setMenuOpen(!menuOpen)}><Icon name="more" /></button>
          {menuOpen && <div className="menu-popover" id="file-menu">
            <button type="button" onClick={() => { setMenuOpen(false); importInput.current?.click(); }}><Icon name="download" />{t('import')}</button>
            <button type="button" onClick={() => { setMenuOpen(false); exportConfig(); }}><Icon name="upload" />{t('export')}</button>
            {isUsb && <button type="button" disabled={!connected || connecting || reading || saving} onClick={() => { setMenuOpen(false); void readFromDevice(); }}><Icon name="download" />{reading ? t('reading') : t('read')}</button>}
            {connected && <button type="button" disabled={connecting || reading || saving} onClick={() => { setMenuOpen(false); void toggleDevice(); }}><Icon name="plug" />{t('disconnect')}</button>}
          </div>}
        </div>
        <input ref={importInput} type="file" accept=".json,application/json" hidden aria-label={t('import')} onChange={event => { void importConfig(event.target.files?.[0]); event.target.value = ''; }} />
      </div>
    </div>
    <div className="app-body">
      <main className="workspace" id="workspace">
        <div className="stage-heading"><h1>{profile.name}</h1><span>{t('select_key')}</span></div>
        <div className="device-stage">
          <div className="pad-shell" style={{ '--brightness': deviceInfo?.brightness === false ? 0 : config.brightness / 100 } as CSSProperties}>
            <div className="pad-port" aria-hidden="true" />
            <div className="key-grid" role="group" aria-label={t('key_grid')}>
              {profile.keys.map((action, index) => <button type="button" className="macro-key" key={index} data-key-index={index} data-physical={deviceInfo ? index < deviceInfo.physicalKeys : undefined} data-hardware-pressed={pressedKeys.includes(index)} tabIndex={selected === index ? 0 : -1} aria-pressed={selected === index} title={deviceInfo && index >= deviceInfo.physicalKeys ? t('future_key') : undefined} aria-label={t('key') + ' ' + (index + 1) + ': ' + action.label + ', ' + t(typeMessage[action.type]) + ', ' + summary(action)} onClick={() => selectKey(index)} onKeyDown={event => {
                const target = ({ ArrowLeft: Math.max(0, index - 1), ArrowRight: Math.min(5, index + 1), ArrowUp: Math.max(0, index - 3), ArrowDown: Math.min(5, index + 3), Home: 0, End: 5 } as Record<string, number>)[event.key];
                if (target === undefined) return;
                event.preventDefault(); selectKey(target); (event.currentTarget.parentElement?.querySelector('[data-key-index="' + target + '"]') as HTMLElement | null)?.focus();
              }}><span className="key-face"><span className="key-topline"><span>{String(index + 1).padStart(2, '0')}</span><Icon name={action.type} /></span><strong>{action.label || '—'}</strong><small>{summary(action)}</small></span></button>)}
            </div>
            <div className="pad-mark"><span className="asset-pair signature"><img data-variant="black" src={darkQ} alt="" /><img data-variant="white" src={lightQ} alt="" /></span><span>TOXIQ</span></div>
          </div>
        </div>
        <div className="device-settings">
          <div className="layout-setting"><label htmlFor="text-layout">{t('typing_layout')}</label><div className="select-wrap"><select id="text-layout" value={config.textLayout} onChange={event => { setConfig(previous => ({ ...previous, textLayout: event.target.value as TextLayout })); setSaveNotice(''); }}>{TEXT_LAYOUTS.map(layout => <option value={layout} key={layout}>{t(layout)}</option>)}</select><Icon name="chevron" /></div><p>{t('layout_hint')}</p></div>
          {deviceInfo?.brightness !== false && <div className="lighting"><label htmlFor="brightness">{t('brightness')} <output>{config.brightness}%</output></label><input id="brightness" type="range" min="0" max="100" value={config.brightness} onChange={event => { setConfig(previous => ({ ...previous, brightness: Number(event.target.value) })); setSaveNotice(''); }} /></div>}
        </div>
      </main>
      <section className="inspector" aria-labelledby="selected-heading">
        <div className="inspector-heading"><span className="selected-key-badge">{String(selected + 1).padStart(2, '0')}</span><div><h2 id="selected-heading">{t('key') + ' ' + String(selected + 1).padStart(2, '0')}</h2><span>{profile.name}</span></div><Icon name={key.type} /></div>
        <div className="inspector-scroll">
          <div className="editor-field"><label htmlFor="key-label">{t('label')}</label><input id="key-label" type="text" maxLength={12} autoComplete="off" value={key.label} onChange={event => updateKey({ label: event.target.value.toUpperCase() })} /></div>
          <div className="editor-field"><label htmlFor="action-type">{t('action')}</label><div className="select-wrap"><select id="action-type" value={key.type} onChange={event => switchAction(event.target.value as KeyAction['type'])}>{ACTION_TYPES.map(type => <option value={type} key={type}>{t(typeMessage[type])}</option>)}</select><Icon name="chevron" /></div></div>
          <div className="editor-field action-value">
            {key.type === 'text' && <><label htmlFor="action-value">{t('message')}</label><textarea id="action-value" rows={6} maxLength={240} placeholder={t('text_placeholder')} value={key.value} aria-invalid={Boolean(error)} aria-describedby={error ? 'key-error' : undefined} onChange={event => updateKey({ value: event.target.value })} /><p className="character-count">{key.value.length} / 240</p></>}
            {key.type === 'hotkey' && <><label htmlFor="action-value">{t('shortcut')}</label><input ref={captureInput} id="action-value" className={capturing ? 'recording' : ''} type="text" autoComplete="off" maxLength={40} value={capturing ? '' : key.value} placeholder={capturing ? t('press_shortcut') : 'CTRL+SHIFT+M'} readOnly={capturing} aria-invalid={Boolean(error)} onChange={event => updateKey({ value: event.target.value.toUpperCase().replaceAll(' ', '') })} onKeyDown={event => { if (!capturing) return; event.preventDefault(); if (event.code === 'Escape') { setCapturing(false); return; } const value = captureHotkey(event.nativeEvent); if (value) { updateKey({ value }); setCapturing(false); } }} onBlur={() => setCapturing(false)} /><button className={'record-button' + (capturing ? ' is-recording' : '')} type="button" onMouseDown={event => event.preventDefault()} onClick={() => setCapturing(value => !value)}><Icon name={capturing ? 'close' : 'record'} /><span>{capturing ? t('cancel') : t('record')}</span></button></>}
            {key.type === 'key' && <><label htmlFor="action-value">{t('key')}</label><div className="select-wrap"><select id="action-value" value={key.value} onChange={event => updateKey({ value: event.target.value })}>{KEY_CODES.map(value => <option key={value}>{value}</option>)}</select><Icon name="chevron" /></div></>}
            {(key.type === 'media' || key.type === 'mouse') && <><label htmlFor="action-value">{t(typeMessage[key.type])}</label><div className="select-wrap"><select id="action-value" value={key.value} onChange={event => updateKey({ value: event.target.value })}>{Object.keys(key.type === 'media' ? MEDIA : MOUSE).map(value => <option key={value} value={value}>{t(value as MessageKey)}</option>)}</select><Icon name="chevron" /></div></>}
            {error && <p id="key-error" className="key-error" role="status">{displayError(error)}</p>}
          </div>
          {deviceInfo && selected >= deviceInfo.physicalKeys && <p className="future-note">{t('future_key')}</p>}
        </div>
        <div className="save-zone"><p className="save-status" role="status">{displayError(saveNotice || (fullError && !error ? fullError : !connected ? isUsb ? 'connect_hint' : 'demo_hint' : isSavedToDemo ? isUsb ? 'current' : 'demo_current' : 'changes'))}</p><button type="button" className="save-button" disabled={!connected || connecting || saving || reading || Boolean(fullError) || isSavedToDemo} onClick={() => void saveToDevice()}><Icon name={isSavedToDemo ? 'check' : 'save'} /><span>{saving ? t('saving') : isUsb ? t('save') : t('save_demo')}</span></button></div>
      </section>
    </div>
    <footer className="statusbar"><span><span className={'status-dot' + (connected ? '' : ' offline')} />{isUsb ? deviceInfo ? 'V0 · ' + deviceInfo.physicalKeys + ' ' + t('physical_keys') + ' · FW ' + deviceInfo.firmware : t('disconnected') : t('demo_hint')}</span><span role="status">{displayError(storageStatus)}</span></footer>
    {notice && <div className="notice" role="status"><Icon name="info" /><p>{displayError(notice)}</p><button className="icon-button" type="button" aria-label={t('close')} onClick={() => setNotice('')}><Icon name="close" /></button></div>}
  </div>;
}
