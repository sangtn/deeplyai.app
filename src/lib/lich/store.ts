// Local, per-browser storage for the Lịch âm personal tools (events, notes, finance, …).
// Nothing leaves the device. Every read and write is guarded, because storage can be missing
// (private windows, blocked site data). Each tool keeps one JSON document under its own key.

const PREFIX = 'lv:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Returns false when the browser refused to save (quota, blocked storage). */
export function save<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const storageAvailable = () => {
  try {
    localStorage.setItem(`${PREFIX}probe`, '1');
    localStorage.removeItem(`${PREFIX}probe`);
    return true;
  } catch {
    return false;
  }
};

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

/** Saves text as a file in the visitor's downloads. */
export function download(filename: string, text: string, type = 'application/json') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Backup file for one tool: { app, key, version, exportedAt, data }. */
export function exportBackup(key: string, data: unknown) {
  const stamp = new Date().toISOString().slice(0, 10);
  download(`lich-viet-${key}-${stamp}.json`, JSON.stringify({ app: 'lich-viet-web', key, version: 1, exportedAt: new Date().toISOString(), data }, null, 2));
}

/** Reads a backup file chosen by the visitor; resolves to its data, or null if it is not a backup for this key. */
export function readBackup<T>(file: File, key: string): Promise<T | null> {
  return file.text().then((text) => {
    try {
      const parsed = JSON.parse(text);
      return parsed && parsed.app === 'lich-viet-web' && parsed.key === key ? (parsed.data as T) : null;
    } catch {
      return null;
    }
  });
}
