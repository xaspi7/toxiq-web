import { parseConfig } from '../config.ts';
import type { Config } from '../config.ts';

export interface DeviceInfo {
  product: string; firmware: string; serial: string; model: string;
  physicalKeys: number; slots: number; brightness: boolean; textLayout: 'US';
}
export interface Port { path: string; label: string }
export type DeviceEvent = { type: 'disconnected'; message: string } | { type: 'button'; key: number; pressed: boolean };
interface State { config: Config; revision: number }
export interface UsbBridge {
  list(): Promise<Port[]>;
  connect(path: string): Promise<State & { info: DeviceInfo }>;
  disconnect(): Promise<void>;
  read(): Promise<State>;
  save(config: Config): Promise<State>;
  onEvent(callback: (event: DeviceEvent) => void): () => void;
}
declare global { interface Window { toxiq?: UsbBridge } }

export class UsbDevice {
  readonly kind = 'usb';
  connected = false;
  info: DeviceInfo | null = null;
  private bridge: UsbBridge;
  constructor(bridge: UsbBridge) { this.bridge = bridge; }
  list(): Promise<Port[]> { return this.bridge.list(); }
  async connect(path = ''): Promise<Config> {
    const state = await this.bridge.connect(path);
    const config = parseConfig(state.config);
    this.info = state.info; this.connected = true;
    return config;
  }
  async disconnect(): Promise<void> { this.connected = false; this.info = null; await this.bridge.disconnect(); }
  async readConfig(): Promise<Config> { return parseConfig((await this.bridge.read()).config); }
  async saveConfig(config: Config): Promise<void> { await this.bridge.save(structuredClone(config)); }
  subscribe(callback: (event: DeviceEvent) => void): () => void {
    return this.bridge.onEvent(event => {
      if (event.type === 'disconnected') { this.connected = false; this.info = null; }
      callback(event);
    });
  }
}
