/**
 * Favorites & LocalStorage Manager for NameMorph
 */

const STORAGE_KEY = 'namemorph_favorites_v1';

export function getFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load favorites', e);
    return [];
  }
}

export function saveFavorite(item) {
  try {
    const favorites = getFavorites();
    if (!favorites.some(f => f.text.toLowerCase() === item.text.toLowerCase())) {
      favorites.unshift({
        text: item.text,
        rule: item.rule || 'Variation',
        tags: item.tags || [],
        savedAt: Date.now()
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
    return getFavorites();
  } catch (e) {
    console.error('Failed to save favorite', e);
    return [];
  }
}

export function removeFavorite(text) {
  try {
    const favorites = getFavorites().filter(f => f.text.toLowerCase() !== text.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    return favorites;
  } catch (e) {
    console.error('Failed to remove favorite', e);
    return [];
  }
}

export function isFavorite(text) {
  const favorites = getFavorites();
  return favorites.some(f => f.text.toLowerCase() === text.toLowerCase());
}

export function clearAllFavorites() {
  localStorage.removeItem(STORAGE_KEY);
  return [];
}
