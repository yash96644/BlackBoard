const getKey = (userId) => `blackboard_v1_${userId}`;

export function saveBoard(pages, userId) {
  if (!userId) return false;
  try {
    localStorage.setItem(
      getKey(userId),
      JSON.stringify({ pages, savedAt: Date.now() })
    );
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') return 'quota';
    return false;
  }
}

export function loadBoard(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(getKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStorage(userId) {
  if (!userId) return;
  localStorage.removeItem(getKey(userId));
}
