import type { Config } from '../config.ts';
export interface ToxiqDevice {
  readonly kind: 'mock';
  readonly connected: boolean;
  connect(): Promise<void>;
  disconnect(): void;
  saveConfig(config: Config): Promise<void>;
}

export class MockDevice implements ToxiqDevice {
  readonly kind = 'mock';
  connected = false;
  private generation = 0;
  private saved: Config | null = null;
  async connect(): Promise<void> { this.generation += 1; this.connected = true; }
  disconnect(): void { this.generation += 1; this.connected = false; }
  async saveConfig(config: Config): Promise<void> {
    if (!this.connected) throw new Error('connect_first');
    const generation = this.generation;
    const snapshot = structuredClone(config);
    await new Promise(resolve => setTimeout(resolve, 380));
    if (!this.connected || generation !== this.generation) throw new Error('demo_disconnected');
    this.saved = snapshot;
  }
  getSavedConfig(): Config | null { return this.saved ? structuredClone(this.saved) : null; }
}
