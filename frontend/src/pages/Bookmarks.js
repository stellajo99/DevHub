// frontend/src/pages/Bookmarks.js
import React, { useEffect, useState } from 'react';
import { Grid, Container, Card, CardContent, Typography, Button, Box, Fade } from '@mui/material';
import { BookmarkBorder as BookmarkIcon, TrendingUp as TrendingIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';

export default function Bookmarks({ user, refreshUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      // naive: fetch first pages and filter client-side by bookmark list
      const { data } = await api.get('/posts', { params: { page: 1, limit: 100 } });
      const setIds = new Set(user?.bookmarks || []);
      setItems(data.items.filter(p => setIds.has(p._id)));
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const toggleBookmark = async (id) => {
    try {
      // Immediately remove from UI
      setItems(prevItems => prevItems.filter(item => item._id !== id));

      // Call the API
      await api.post(`/posts/${id}/bookmark`);

      // Refresh user data in background
      if (refreshUser) {
        refreshUser();
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      // On error, reload the list to restore correct state
      load();
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
          My Bookmarks
        </Typography>
        <Typography>Loading bookmarks...</Typography>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
          My Bookmarks
        </Typography>

        <Fade in={true} timeout={600}>
          <Card
            sx={{
              maxWidth: 600,
              mx: 'auto',
              mt: 8,
              p: 6,
              textAlign: 'center',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              border: '2px dashed #cbd5e1',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
          >
            <Box sx={{ mb: 4 }}>
              <BookmarkIcon
                sx={{
                  fontSize: 80,
                  color: '#94a3b8',
                  mb: 2
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: '#64748b',
                  mb: 2
                }}
              >
                No Bookmarks Yet
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}
              >
                Start exploring posts and bookmark the ones you find interesting.
                Your saved posts will appear here for easy access later.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<TrendingIcon />}
                onClick={() => navigate('/')}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: '16px',
                  px: 4,
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
                Explore Posts
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/write')}
                sx={{
                  borderRadius: '16px',
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    backgroundColor: '#f8fafc',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Write a Post
              </Button>
            </Box>
          </Card>
        </Fade>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <BookmarkIcon sx={{ fontSize: 32, color: '#6366f1' }} />
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
          My Bookmarks
        </Typography>
        <Typography
          variant="body1"
          sx={{
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            px: 2,
            py: 0.5,
            borderRadius: '12px',
            fontWeight: 600
          }}
        >
          {items.length} saved
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {items.map((post, index) => (
          <Grid item xs={12} md={6} key={post._id}>
            <Fade in={true} timeout={400} style={{ transitionDelay: `${index * 100}ms` }}>
              <div>
                <PostCard
                  post={post}
                  onToggleBookmark={toggleBookmark}
                  isBookmarked={true}
                />
              </div>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
