export const PROFILE_IDS = ['moba', 'fps', 'creator', 'custom'] as const;
export type ProfileId = typeof PROFILE_IDS[number];
export const ACTION_TYPES = ['key', 'hotkey', 'text', 'media', 'mouse'] as const;
export type ActionType = typeof ACTION_TYPES[number];
export type Theme = 'black' | 'white';
export interface KeyAction { label: string; type: ActionType; value: string }
export interface Profile { name: string; keys: KeyAction[] }
export interface Config {
  version: 1;
  activeProfile: ProfileId;
  brightness: number;
  profiles: Record<ProfileId, Profile>;
}
export const MEDIA = { PLAY_PAUSE: 'Přehrát / pozastavit', VOLUME_MUTE: 'Ztlumit zvuk', VOLUME_UP: 'Zvýšit hlasitost', VOLUME_DOWN: 'Snížit hlasitost', NEXT_TRACK: 'Další skladba', PREVIOUS_TRACK: 'Předchozí skladba' };
export const MOUSE = { LEFT_CLICK: 'Levé tlačítko', RIGHT_CLICK: 'Pravé tlačítko', MIDDLE_CLICK: 'Prostřední tlačítko', SCROLL_UP: 'Posunout nahoru', SCROLL_DOWN: 'Posunout dolů' };
export const KEY_CODES = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...'0123456789',
  ...Array.from({ length: 24 }, (_, index) => `F${index + 1}`),
  'ENTER', 'SPACE', 'TAB', 'ESC', 'BACKSPACE', 'DELETE', 'INSERT', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN', 'UP', 'DOWN', 'LEFT', 'RIGHT',
];
const MODIFIERS = ['CTRL', 'ALT', 'SHIFT', 'META'];
export const STORAGE_KEY = 'toxiq.configurator.v1';
export const THEME_KEY = 'toxiq-theme';

export function defaultAction(type: ActionType): string {
  return { key: 'F1', hotkey: 'CTRL+SHIFT+M', text: '', media: 'PLAY_PAUSE', mouse: 'LEFT_CLICK' }[type];
}
export function actionError(key: KeyAction): string | null {
  if (!key.label.trim()) return 'Doplň název klávesy.';
  if (key.label.length > 12) return 'Název může mít nejvýš 12 znaků.';
  if (key.type === 'text') {
    if (!key.value.trim()) return 'Doplň text, který má klávesa napsat.';
    if (key.value.length > 240) return 'Text může mít nejvýš 240 znaků.';
  } else if (key.type === 'key') {
    if (!KEY_CODES.includes(key.value)) return 'Vyber platnou klávesu.';
  } else if (key.type === 'hotkey') {
    const parts = key.value.split('+');
    const keyCode = parts.at(-1) ?? '';
    const modifiers = parts.slice(0, -1);
    if (!KEY_CODES.includes(keyCode) || !modifiers.length || modifiers.some(part => !MODIFIERS.includes(part)) || new Set(modifiers).size !== modifiers.length) return 'Použij zkratku jako CTRL+SHIFT+M.';
  } else if (key.type === 'media' && !Object.hasOwn(MEDIA, key.value)) return 'Vyber mediální akci.';
  else if (key.type === 'mouse' && !Object.hasOwn(MOUSE, key.value)) return 'Vyber akci myši.';
  return null;
}
export function configError(config: Config): string | null {
  for (const id of PROFILE_IDS) {
    for (const [index, key] of config.profiles[id].keys.entries()) {
      const error = actionError(key);
      if (error) return `${config.profiles[id].name} / klávesa ${index + 1}: ${error}`;
    }
  }
  return null;
}
export function makeDefaultConfig(): Config {
  const text = (label: string, value: string): KeyAction => ({ label, type: 'text', value });
  const hotkey = (label: string, value: string): KeyAction => ({ label, type: 'hotkey', value });
  const key = (label: string, value: string): KeyAction => ({ label, type: 'key', value });
  return {
    version: 1, activeProfile: 'moba', brightness: 40,
    profiles: {
      moba: { name: 'MOBA', keys: [text('BARON', 'BARON NOW'), text('DRAKE', 'DRAKE IN 30'), text('PUSH', 'PUSH MID'), text('BACK', 'RESET AND BACK'), text('PING', 'ON MY WAY'), text('GG', 'GG WP')] },
      fps: { name: 'FPS', keys: [hotkey('MIC', 'CTRL+SHIFT+M'), hotkey('CLIP', 'ALT+F10'), key('MAP', 'M'), text('TEAM', 'GROUP UP'), { label: 'MEDIA', type: 'media', value: 'PLAY_PAUSE' }, text('GG', 'GG')] },
      creator: { name: 'CREATOR', keys: [hotkey('CUT', 'CTRL+K'), hotkey('UNDO', 'CTRL+Z'), key('MARK', 'M'), key('PLAY', 'SPACE'), { label: 'MUTE', type: 'media', value: 'VOLUME_MUTE' }, hotkey('SAVE', 'CTRL+S')] },
      custom: { name: 'CUSTOM', keys: Array.from({ length: 6 }, (_, index) => key(`KEY ${index + 1}`, `${index + 1}`)) },
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
// Build a clean object, never merge imported properties into app state.
export function parseConfig(input: unknown, options: { allowDraft?: boolean; legacy?: boolean } = {}): Config {
  if (!isObject(input) || (!options.legacy && input.version !== 1) || !isObject(input.profiles)) throw new Error('Tohle není podporovaný TOXIQ profil (verze 1).');
  if (typeof input.brightness !== 'number' || !Number.isInteger(input.brightness) || input.brightness < 0 || input.brightness > 100) throw new Error('Jas musí být celé číslo od 0 do 100.');
  const output = makeDefaultConfig();
  output.brightness = input.brightness;
  if (input.activeProfile !== undefined) {
    if (!PROFILE_IDS.includes(input.activeProfile as ProfileId)) throw new Error('Neplatný aktivní profil.');
    output.activeProfile = input.activeProfile as ProfileId;
  }
  for (const id of PROFILE_IDS) {
    const profile = input.profiles[id];
    if (!isObject(profile) || !Array.isArray(profile.keys) || profile.keys.length !== 6) throw new Error(`Profil ${id.toUpperCase()} musí obsahovat přesně šest kláves.`);
    output.profiles[id].keys = profile.keys.map((value: unknown) => {
      if (!isObject(value) || typeof value.label !== 'string' || value.label.length > 12 || !ACTION_TYPES.includes(value.type as ActionType) || typeof value.value !== 'string' || value.value.length > 240) throw new Error(`Profil ${id.toUpperCase()} obsahuje neplatnou akci.`);
      return { label: value.label, type: value.type as ActionType, value: value.value };
    });
  }
  const error = configError(output);
  if (error && !options.allowDraft) throw new Error(error);
  return output;
}
export function summary(key: KeyAction): string { return key.value.replaceAll('_', ' ') || key.type.toUpperCase(); }
export function captureHotkey(event: Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>): string | null {
  let code = event.code.replace(/^(Key|Digit)/, '').toUpperCase();
  code = ({ ESCAPE: 'ESC', ARROWUP: 'UP', ARROWDOWN: 'DOWN', ARROWLEFT: 'LEFT', ARROWRIGHT: 'RIGHT' } as Record<string, string>)[code] || code;
  if (!KEY_CODES.includes(code)) return null;
  const modifiers = [event.ctrlKey && 'CTRL', event.altKey && 'ALT', event.shiftKey && 'SHIFT', event.metaKey && 'META'].filter(Boolean);
  return modifiers.length ? [...modifiers, code].join('+') : null;
}
