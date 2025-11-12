// Simple in-memory storage for generic string key-value pairs
export interface GenericStringStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export class InMemoryStringStorage implements GenericStringStorage {
  private storage = new Map<string, string>();

  get(key: string): string | null {
    return this.storage.get(key) || null;
  }

  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  remove(key: string): void {
    this.storage.delete(key);
  }
}


