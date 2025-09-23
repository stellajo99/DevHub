// frontend/src/pages/PostEdit.js
import React, { useState, useEffect } from 'react';
import { Box, Button, MenuItem, TextField, Chip, Typography, Stack, Card, CardContent, Container, Fade, CircularProgress } from '@mui/material';
import { Edit as EditIcon, Label as LabelIcon, Category as CategoryIcon, Save as SaveIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function PostEdit({ isAuthenticated }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '', category: 'General', tags: [] });
  const [loading, setLoading] = useState(true);

  const availableTags = [
    'JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'HTML', 'CSS',
    'MongoDB', 'Express', 'API', 'Frontend', 'Backend', 'Database', 'Web Dev',
    'Mobile', 'iOS', 'Android', 'Flutter', 'React Native', 'Vue.js', 'Angular',
    'DevOps', 'Docker', 'AWS', 'Git', 'Testing', 'Security', 'Performance',
    'UI/UX', 'Design', 'Beginner', 'Advanced', 'Tutorial', 'Tips'
  ];

  const toggleTag = (tag) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const loadPost = async () => {
    try {
      const { data } = await api.get(`/posts/${id}`);
      setForm({
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || []
      });
    } catch (error) {
      console.error('Failed to load post:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        content: form.content,
        category: form.category,
        tags: form.tags
      };
      await api.put(`/posts/${id}`, payload);
      navigate(`/post/${id}`);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: '#64748b' }}>
          Loading post...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Fade in={true} timeout={600}>
        <Card
          sx={{
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={4}>
              <EditIcon sx={{ fontSize: 40, color: '#f59e0b' }} />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Edit Post
              </Typography>
            </Box>

            <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 4 }}>
              <TextField
                label="Post Title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#cbd5e1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f59e0b',
                    }
                  }
                }}
                InputProps={{
                  startAdornment: <EditIcon sx={{ mr: 1, color: '#64748b' }} />
                }}
              />

              <TextField
                label="Category"
                select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                  }
                }}
                InputProps={{
                  startAdornment: <CategoryIcon sx={{ mr: 1, color: '#64748b' }} />
                }}
              >
                {['General', 'Q&A', 'Showcase', 'Jobs', 'Events'].map(c => (
                  <MenuItem key={c} value={c} sx={{ borderRadius: '8px', mx: 1, my: 0.5 }}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>

              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LabelIcon sx={{ color: '#64748b' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Tags ({form.tags.length} selected)
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 3,
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {availableTags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        variant={form.tags.includes(tag) ? 'filled' : 'outlined'}
                        color={form.tags.includes(tag) ? 'warning' : 'default'}
                        onClick={() => toggleTag(tag)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: '20px',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>

              <TextField
                label="Content"
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                multiline
                rows={12}
                required
                placeholder="Update your post content..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#cbd5e1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f59e0b',
                    }
                  }
                }}
              />

              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/post/${id}`)}
                  sx={{
                    borderRadius: '25px',
                    px: 4,
                    py: 1.5,
                    borderColor: '#cbd5e1',
                    color: '#64748b',
                    '&:hover': {
                      borderColor: '#94a3b8',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{
                    borderRadius: '25px',
                    px: 4,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
                    '&:hover': {
                      boxShadow: '0 12px 32px rgba(245, 158, 11, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Update Post
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Container>
  );
}