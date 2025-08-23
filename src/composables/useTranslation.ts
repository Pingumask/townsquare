import { useStore } from 'vuex';

/**
 * Composable that provides a clean translation function
 * @returns {Function} t - Translation function that takes a dot-notation key
 */
export function useTranslation() {
  const store = useStore();

  /**
   * Translation function that traverses locale objects using dot notation
   * @param {string} key - Dot-notation key (e.g., 'menu.grimoire.title')
   * @returns {string} Translated string with fallback support
   */
  const t = (key: string): string => {
    return store.getters.t(key);
  };

  return { t };
}
