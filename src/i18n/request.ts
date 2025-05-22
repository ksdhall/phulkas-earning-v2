// i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';
 
export default getRequestConfig(async ({ requestLocale, url }) => {

  // Await the requestLocale if it's a Promise
  let awaitedLocale = typeof requestLocale?.then === 'function'
    ? await requestLocale
    : requestLocale;

  if (typeof awaitedLocale === 'undefined' && url) {
    // Try to extract locale from the URL path (e.g., /ja/...)
    const match = url.pathname.match(/^\/([a-zA-Z-]+)\b/);
    if (match && hasLocale(routing.locales, match[1])) {
      awaitedLocale = match[1];
    }
  }

  const locale = hasLocale(routing.locales, awaitedLocale)
    ? awaitedLocale
    : routing.defaultLocale;

  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    // fallback to default locale messages
    messages = (await import(`../messages/${routing.defaultLocale}.json`)).default;
  }

  return {
    locale,
    messages,
    timeZone: 'Asia/Tokyo'
  };
});
