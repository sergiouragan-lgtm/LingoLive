// Node 26 exposes an unavailable global localStorage unless a backing file is
// configured. Keep tests browser-like and isolated with an in-memory Storage.
class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(String(key)) ?? null; }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null; }
  removeItem(key: string) { this.values.delete(String(key)); }
  setItem(key: string, value: string) { this.values.set(String(key), String(value)); }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, name, { configurable: true, value: new MemoryStorage() });
  Object.defineProperty(window, name, { configurable: true, value: globalThis[name] });
}
