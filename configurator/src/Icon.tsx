import type { ReactNode } from 'react';

export type IconName = 'key' | 'hotkey' | 'text' | 'media' | 'mouse' | 'moba' | 'fps' | 'creator' | 'custom' | 'sun' | 'moon' | 'download' | 'upload' | 'save' | 'plug' | 'check' | 'close' | 'record' | 'chevron' | 'info';
const drawings: Record<IconName, ReactNode> = {
  key: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h1m3 0h1m3 0h1m-9 4h1m3 0h1m3 0h1m-9 3h9" /></>,
  hotkey: <><path d="M9 7h6v10H9zM9 7V5a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v14a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2V7" /></>,
  text: <><path d="M5 5h14M12 5v14M8 19h8M5 5v3m14-3v3" /></>,
  media: <><path d="m11 5-5 4H3v6h3l5 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  mouse: <><rect x="6" y="2" width="12" height="20" rx="6" /><path d="M12 2v7M6 9h12" /></>,
  moba: <><path d="m5 3 13 13m1-13L6 16M4 13l7 7m2-7 7 7M3 21l4-4m10 0 4 4M5 3l5 1-6 6-1-5m16-2-5 1 6 6 1-5" /></>,
  fps: <><circle cx="12" cy="12" r="7" /><path d="M12 2v6m0 8v6M2 12h6m8 0h6" /><circle cx="12" cy="12" r="1" /></>,
  creator: <><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4" /></>,
  custom: <><path d="M4 6h4m4 0h8M4 12h9m4 0h3M4 18h2m4 0h10" /><path d="M8 3v6m5 0v6m-7 0v6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <path d="M20 15a9 9 0 0 1-11-11A9 9 0 1 0 20 15Z" />,
  download: <><path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4" /></>,
  upload: <><path d="M12 15V3m-4 4 4-4 4 4M4 17v4h16v-4" /></>,
  save: <><path d="M4 3h13l4 4v14H3V3h1Z" /><path d="M7 3v6h9V3M7 21v-8h10v8" /></>,
  plug: <><path d="M8 2v5m8-5v5M6 7h12v3a6 6 0 0 1-12 0V7Zm6 9v6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  record: <circle cx="12" cy="12" r="6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
};
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawings[name]}</svg>;
}
