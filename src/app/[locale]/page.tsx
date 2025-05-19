// src/app/[locale]/page.tsx
// This is a Server Component by default in the App Router

import { getSession } from '@/utils/auth'; // Assuming this is your server-side getSession utility
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm'; // Assuming LoginForm is a Client Component
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl'; // useTranslations can be used in Server Components
import { PageProps } from 'next'; // Import the standard PageProps type


// Use the standard PageProps type for the component props
// Specify the shape of the dynamic params within the generic
interface LoginPageProps extends PageProps<{ locale: string }> {}


// Login Page Server Component
export default async function LoginPage({ params: { locale } }: LoginPageProps) {

  // Check if the user is already authenticated using the getSession utility
  const session = await getSession();
   console.log("Login Page: Session:", session);

  // If authenticated, redirect to the dashboard
  if (session) {
     console.log("Login Page: User authenticated, redirecting to dashboard.");
    redirect(`/${locale}/dashboard`);
  }

  // Use translations in the Server Component
  const t = useTranslations('login');


  // If not authenticated, render the login form (which should be a Client Component)
  return (
    // The Layout component is handled by the root layout
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        p: 2,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        {t('title')}
      </Typography>
      <LoginForm />
    </Box>
  );
}
