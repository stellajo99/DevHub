// frontend/src/pages/AuthLanding.js
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, CardHeader, Typography, TextField, Button,
  Tabs, Tab, Grid, Divider, InputAdornment, IconButton, Link as MuiLink, Alert
} from '@mui/material';
import {
  Email as EmailIcon,
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';

function useQueryTab() {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const tab = search.get('tab');
  if (tab === 'register') return 1;
  return 0;
}

export default function AuthLanding({ onLogin, onRegister }) {
  const navigate = useNavigate();
  const location = useLocation();

  const initialTab = useQueryTab();
  const [tab, setTab] = useState(initialTab);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nickname: '' });
  const [error, setError] = useState('');

  // React to query string changes (?tab=login|register)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    setTab(t === 'register' ? 1 : 0);
  }, [location.search]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (tab === 0) {
        const res = await api.post('/auth/login', { email: form.email, password: form.password });
        onLogin && onLogin(res.data);
        navigate('/');
      } else {
        const res = await api.post('/auth/register', {
          email: form.email,
          password: form.password,
          nickname: form.nickname
        });
        onRegister && onRegister(res.data);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'auto',                 // Remove forced full height
        display: 'block',
        background: 'linear-gradient(135deg, #eef2ff 0%, #fdf2f8 100%)',
        pt: 0,                             // Remove top padding
        pb: { xs: 4, md: 8 },              // Keep some bottom padding
      }}
    >
      <Grid
        container
        spacing={4}
        alignItems="flex-start"
        sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 0 }, mt: 0 }}
      >
        {/* Top row: Title and description */}
        <Grid item xs={12}>
          <Box sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 1, md: 2 } }}>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -0.5, mb: 1 }}>
              Welcome to{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                DevHub
              </Box>
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Share posts, bookmark ideas, and grow with the community. Sign in or create an account to get started.
            </Typography>
          </Box>
        </Grid>

        {/* Bottom row: Left (login/register card) and Right (Why join box) aligned on the same Y-axis */}
        <Grid item xs={12} md={6}>
          <Card elevation={8} sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <CardHeader
              title={
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                  <Tab label="Login" />
                  <Tab label="Register" />
                </Tabs>
              }
              sx={{ px: 0 }}
            />
            <Divider />
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  name="password"
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPw((s) => !s)}
                          edge="end"
                          aria-label="toggle password visibility"
                        >
                          {showPw ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                {tab === 1 && (
                  <TextField
                    name="nickname"
                    label="Nickname"
                    value={form.nickname}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{
                    mt: 1.5,
                    py: 1.2,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    ':hover': {
                      background: 'linear-gradient(135deg, #5855eb 0%, #7c3aed 100%)',
                    }
                  }}
                >
                  {tab === 0 ? 'Login' : 'Create account'}
                </Button>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {tab === 0 ? (
                    <>
                      New here?{' '}
                      <MuiLink component={Link} to="/auth?tab=register">
                        Create an account
                      </MuiLink>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <MuiLink component={Link} to="/auth?tab=login">
                        Sign in
                      </MuiLink>
                    </>
                  )}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box
            sx={{
              borderRadius: 4,
              p: 4,
              background: 'linear-gradient(180deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
              border: '1px solid #e5e7eb'
            }}
          >
            <Typography variant="overline" sx={{ letterSpacing: 1.5 }}>
              Why join
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
              Your hub for developers
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Explore curated posts by category, save your bookmarks, and contribute with your own write-ups.
            </Typography>
            <Grid container spacing={2}>
              {[
                { title: 'Discover', desc: 'Trending posts and fresh ideas.' },
                { title: 'Organise', desc: 'Bookmarks and categories.' },
                { title: 'Create', desc: 'Write and edit posts with ease.' },
              ].map((f, idx) => (
                <Grid key={idx} item xs={12}>
                  <Box
                    sx={{
                      p: 2.2,
                      borderRadius: 3,
                      bgcolor: 'white',
                      border: '1px solid #e5e7eb',
                      display: 'grid',
                      gap: 0.5
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>{f.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.desc}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
