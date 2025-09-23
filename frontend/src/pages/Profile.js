// frontend/src/pages/Profile.js
import React, { useEffect, useState } from 'react';
import {
  Box, Button, TextField, Typography, Container, Card, CardContent,
  Avatar, Grid, Paper, Alert, CircularProgress, Fade, Divider, Chip
} from '@mui/material';
import {
  Person as PersonIcon, Email as EmailIcon, Edit as EditIcon,
  Save as SaveIcon, Cancel as CancelIcon, AccountCircle as AccountIcon
} from '@mui/icons-material';
import api from '../services/api';

export default function Profile({ user, onUpdateProfile }) {
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userStats, setUserStats] = useState({ posts: 0, bookmarks: 0 });

  useEffect(() => {
    setNickname(user?.nickname || '');
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      // Get user's posts count
      const { data } = await api.get('/posts', { params: { author: user.email, limit: 1 } });
      setUserStats({
        posts: data.total || 0,
        bookmarks: user?.bookmarks?.length || 0
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setMessage({ text: 'Nickname cannot be empty', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', { nickname: nickname.trim() });
      onUpdateProfile?.(data);
      setIsEditing(false);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNickname(user?.nickname || '');
    setIsEditing(false);
    setMessage({ text: '', type: '' });
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Fade in={true} timeout={600}>
        <Box>
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              My Profile
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Manage your account settings and preferences
            </Typography>
          </Box>

          {/* Profile Card */}
          <Card
            sx={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              overflow: 'visible'
            }}
          >
            {/* Profile Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 4,
                borderRadius: '20px 20px 0 0',
                position: 'relative',
                textAlign: 'center',
                color: 'white'
              }}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  border: '4px solid rgba(255,255,255,0.3)'
                }}
              >
                {user?.nickname?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {user?.nickname || 'User'}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Stats Section */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      border: '1px solid #e0f2fe'
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e40af', mb: 1 }}>
                      {userStats.posts}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Posts Created
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      border: '1px solid #bbf7d0'
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#166534', mb: 1 }}>
                      {userStats.bookmarks}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Bookmarks
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Profile Form */}
              <Box component="form" onSubmit={handleSave}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountIcon sx={{ color: '#6366f1' }} />
                  Account Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={user?.email || ''}
                      disabled
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: '#94a3b8' }} />
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          backgroundColor: '#f8fafc'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Display Name"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: '#94a3b8' }} />
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          backgroundColor: isEditing ? '#ffffff' : '#f8fafc'
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Message Alert */}
                {message.text && (
                  <Fade in={true}>
                    <Alert
                      severity={message.type}
                      sx={{
                        mt: 3,
                        borderRadius: '12px',
                        '& .MuiAlert-message': { fontWeight: 500 }
                      }}
                    >
                      {message.text}
                    </Alert>
                  </Fade>
                )}

                {/* Action Buttons */}
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  {!isEditing ? (
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditing(true)}
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: '12px',
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5855eb 0%, #7c3aed 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)'
                        }
                      }}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        disabled={loading}
                        sx={{
                          borderRadius: '12px',
                          px: 3,
                          py: 1.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: '#e2e8f0',
                          color: '#64748b',
                          '&:hover': {
                            borderColor: '#cbd5e1',
                            backgroundColor: '#f8fafc'
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                        disabled={loading}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          borderRadius: '12px',
                          px: 3,
                          py: 1.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Fade>
    </Container>
  );
}
