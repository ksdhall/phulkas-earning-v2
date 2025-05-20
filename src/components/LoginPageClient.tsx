"use client";

import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const LoginPageClient: React.FC = () => {
  const t = useTranslations('login');
  const tGeneral = useTranslations();

  // Change state variable from 'email' to 'username'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('credentials', {
      redirect: false,
      username, // Pass the 'username' state here
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError(tGeneral('auth.login_failed'));
      console.error("Login failed:", result.error);
    } else {
      router.push('/en/dashboard'); // Or dynamically determine locale
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
        {t('title')}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ marginBottom: 2, width: '100%' }}>
          {error}
        </Alert>
      )}
      <TextField
        margin="normal"
        required
        fullWidth
        id="username" // Change ID from 'email' to 'username'
        label={t('username_label')} // Use new translation key for label
        name="username"
        autoComplete="username" // Change autoComplete
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)} // Update state setter
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label={t('password_label')}
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
        {loading ? <CircularProgress size={24} color="inherit" /> : t('login_button')}
      </Button>
    </Box>
  );
};

export default LoginPageClient;
