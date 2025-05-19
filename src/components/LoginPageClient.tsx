// src/components/LoginPageClient.tsx
"use client"; // This directive MUST be at the very top to make it a Client Component

import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { useTranslations } from 'next-intl'; // useTranslations can be used here
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // useRouter can be used here

const LoginPageClient: React.FC = () => {
  // useTranslations hook is correctly used in this Client Component
  const t = useTranslations('login');
  const tGeneral = useTranslations(); // For general terms like "Login"

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('credentials', {
      redirect: false, // Prevent automatic redirect
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError(tGeneral('auth.login_failed')); // Use general translation for login failure
      console.error("Login failed:", result.error);
    } else {
      // Redirect to the dashboard or a protected page on success
      router.push('/en/dashboard'); // Adjust the redirect path as needed
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleLogin}
      sx={{
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 400,
        margin: '0 auto',
        padding: 3,
        border: '1px solid #ccc',
        borderRadius: 2,
        boxShadow: 3
      }}
    >
      <Typography component="h1" variant="h5" gutterBottom>
        {t('title')} {/* Use translation */}
      </Typography>
      {error && <Alert severity="error" sx={{ marginBottom: 2, width: '100%' }}>{error}</Alert>}
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label={t('email_label')} {/* Use translation */}
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label={t('password_label')} {/* Use translation */}
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ marginTop: 3, marginBottom: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : tGeneral('auth.login_button')} {/* Use general translation */}
      </Button>
    </Box>
  );
};

export default LoginPageClient;
