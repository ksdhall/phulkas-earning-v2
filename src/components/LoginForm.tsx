// src/components/LoginForm.tsx
"use client"; // This directive MUST be the very first line

import React, { useState } from 'react';
import { signIn } from 'next-auth/react'; // signIn is a client-side function
import { useRouter, useParams } from 'next/navigation'; // useRouter and useParams are client-side hooks
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useTranslations } from 'next-intl'; // useTranslations can be used in Client Components


const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string; // Access locale from params in Client Component

  const t = useTranslations('login'); // Use translations in Client Component

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false, // Prevent automatic redirect
      username,
      password,
    });

    setLoading(false);

    if (result?.error) {
      console.error("Login failed:", result.error);
      // Use translation for login error message
      setError(t('login_error'));
    } else {
      // Redirect to the dashboard page for the current locale
      router.push(`/${locale}/dashboard`);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        mt: 3,
        p: 3,
        border: '1px solid #ccc',
        borderRadius: '8px',
        maxWidth: 400,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label={t('username_label')}
        variant="outlined"
        fullWidth
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <TextField
        label={t('password_label')}
        variant="outlined"
        fullWidth
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
        {loading ? <CircularProgress size={24} /> : t('login_button')}
      </Button>
    </Box>
  );
};

export default LoginForm;
