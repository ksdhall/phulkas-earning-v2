"use client";

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { EmotionCache } from '@emotion/cache';

export default function MuiRegistry({ children }: { children: React.ReactNode }) { // This is a DEFAULT export
  const [cache] = useState(() => {
    const cache = createCache({ key: 'mui' });
    cache.compat = true;
    return cache;
  });

  const [inserted] = useState<string[]>([]);

  useServerInsertedHTML(() => {
    const serialized = cache.sheet.tags.join('');
    if (serialized.length === 0) {
      return null;
    }
    if (inserted.includes(serialized)) {
      return null;
    }
    inserted.push(serialized);
    return (
      <style
        data-emotion={`${cache.key} ${serialized.substring(0, serialized.indexOf('{'))}`}
        dangerouslySetInnerHTML={{ __html: serialized }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
