// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  localeDetection: false,
  localePrefix: 'always',
});

export const config = {
  matcher: [
    '/',
    '/(ja|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};

export function middleware(request: NextRequest) {
  const response = createMiddleware({
    locales: ['en', 'ja'],
    defaultLocale: 'en',
    localeDetection: false,
    localePrefix: 'always',
  })(request);

  return response;
}
