const KEY = 'blackboard_v1';

export function saveBoard(pages) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ pages, savedAt: Date.now() }));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') return 'quota';
    return false;
  }
}

export function loadBoard() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStorage() {
  localStorage.removeItem(KEY);
}
