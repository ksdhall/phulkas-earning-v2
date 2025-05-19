// src/createEmotionCache.ts
import createCache from '@emotion/cache';

// Create a shared Emotion cache instance for Material UI SSR
const createEmotionCache = () => {
  return createCache({ key: 'css', prepend: true });
};

export default createEmotionCache;