// frontend/src/pages/Home.js
import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Pagination, Box, Chip, Stack, Typography, Container, Fade, Card, CardContent, Button } from '@mui/material';
import { Explore as ExploreIcon, TrendingUp as TrendingIcon } from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';

export default function Home({ user, refreshUser, categories, setCategories, categoryStats, setCategoryStats }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 10 });
  const [totalStats, setTotalStats] = useState({ items: [], total: 0 });
  const [popularTags, setPopularTags] = useState([]);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const fetchData = async () => {
    try {
      const { data } = await api.get('/posts', { params: { page, search, category } });
      setData(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setData({ items: [], total: 0, page: 1, limit: 10 });
    }
  };

  const fetchTotalStats = async () => {
    try {
      const { data } = await api.get('/posts', { params: { limit: 1000 } }); // Get all posts for stats
      setTotalStats(data);
    } catch (error) {
      console.error('Failed to fetch total stats:', error);
      setTotalStats({ items: [], total: 0 });
    }
  };

  const fetchPopularTags = async () => {
    try {
      const { data } = await api.get('/posts/tags/popular', { params: { limit: 12 } });
      setPopularTags(data);
    } catch (error) {
      console.error('Failed to fetch popular tags:', error);
      setPopularTags([]);
    }
  };

  useEffect(() => { fetchData(); }, [page, search, category]);
  useEffect(() => {
    fetchTotalStats();
    fetchPopularTags();
  }, []); // Only fetch once on mount

  const setPage = (_e, p) => setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    next.set('page', String(p));
    return next;
  });

  const toggleBookmark = async (id) => {
    try {
      await api.post(`/posts/${id}/bookmark`);
      await fetchData();
      if (refreshUser) {
        refreshUser();
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  const userBookmarks = useMemo(() => new Set(user?.bookmarks || []), [user]);

  const categoriesData = [
    { name: 'General', icon: '💡', color: '#6366f1' },
    { name: 'Q&A', icon: '❓', color: '#10b981' },
    { name: 'Showcase', icon: '🚀', color: '#f59e0b' },
    { name: 'Jobs', icon: '💼', color: '#ef4444' },
    { name: 'Events', icon: '📅', color: '#8b5cf6' }
  ];

  // Initialize categories and stats if not already set
  if (categories.length === 0) {
    setCategories(categoriesData);
  }

  const updateCategoryStats = () => {
    const stats = {};
    categoriesData.forEach(cat => {
      stats[cat.name] = totalStats.items?.filter(post => post.category === cat.name).length || 0;
    });
    setCategoryStats(stats);
  };

  // Update stats whenever total stats change
  React.useEffect(() => {
    updateCategoryStats();
  }, [totalStats.items]);

  return (
    <Container maxWidth="xl" sx={{ py: 2, px: { xs: 2, sm: 3 } }}>
      <Grid container spacing={2}>
        {/* Main Content Area */}
        <Grid item xs={12} md={8} lg={9}>


          {/* Posts Section */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TrendingIcon sx={{ fontSize: 24, color: '#6366f1' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
              {category ? `${category} Posts` : 'Latest Posts'}
            </Typography>
            <Chip
              label={`${data.total || 0} posts`}
              size="small"
              sx={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontWeight: 600
              }}
            />
          </Box>

          {/* Posts Grid - Two columns for dense display */}
          <Grid container spacing={2}>
            {(data.items || []).map((post, index) => (
              <Grid item xs={12} sm={6} key={post._id}>
                <Fade in={true} timeout={400} style={{ transitionDelay: `${index * 50}ms` }}>
                  <div>
                    <PostCard
                      post={post}
                      onToggleBookmark={toggleBookmark}
                      isBookmarked={userBookmarks.has(post._id)}
                    />
                  </div>
                </Fade>
              </Grid>
            ))}
          </Grid>
          {/* Pagination */}
          {data.total > data.limit && (
            <Box
              display="flex"
              justifyContent="center"
              sx={{
                mt: 4,
                p: 2,
                backgroundColor: '#f8fafc',
                borderRadius: '16px'
              }}
            >
              <Pagination
                count={Math.max(1, Math.ceil((data.total || 0) / (data.limit || 10)))}
                page={data.page || 1}
                onChange={setPage}
                size="medium"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '12px',
                    fontWeight: 600,
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5855eb 0%, #7c3aed 100%)',
                      }
                    }
                  }
                }}
              />
            </Box>
          )}

          {/* Empty State */}
          {(!data.items || data.items.length === 0) && (
            <Card
              sx={{
                mt: 4,
                p: 4,
                textAlign: 'center',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '2px dashed #cbd5e1'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b', mb: 2 }}>
                {category ? `No ${category} posts found` : 'No posts yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {category
                  ? 'Try exploring other categories or be the first to post here!'
                  : 'Be the first to share something amazing with the community!'
                }
              </Typography>
            </Card>
          )}
        </Grid>

        {/* Sidebar - Fixed width of 280px when visible */}
        <Grid item xs={12} md={4} lg={3}>
          <Box sx={{
            position: 'sticky',
            top: 80,
            width: { md: '280px' },
            maxWidth: '100%'
          }}>
            {/* Quick Actions */}
            <Card
              sx={{
                mb: 3,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={2}>
                  {user && (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<span style={{ fontSize: '16px' }}>✍️</span>}
                      onClick={() => navigate('/write')}
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: '12px',
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
                      Write New Post
                    </Button>
                  )}
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<span style={{ fontSize: '16px' }}>🔍</span>}
                    onClick={() => document.querySelector('input[placeholder*=\"Search\"]')?.focus()}
                    sx={{
                      borderRadius: '12px',
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
                    Search Posts
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Quick Filters */}
            <Card
              sx={{
                mb: 3,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <span style={{ fontSize: '18px' }}>🏷️</span>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Quick Filters
                  </Typography>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {popularTags.map((tagData) => (
                    <Chip
                      key={tagData.tag}
                      label={`${tagData.tag} (${tagData.count})`}
                      size="small"
                      variant="outlined"
                      onClick={() => setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        next.set('search', tagData.tag);
                        next.set('page', '1');
                        return next;
                      })}
                      sx={{
                        fontSize: '0.7rem',
                        height: 28,
                        backgroundColor: searchParams.get('search') === tagData.tag ? '#eff6ff' : 'transparent',
                        borderColor: searchParams.get('search') === tagData.tag ? '#3b82f6' : '#e2e8f0',
                        color: searchParams.get('search') === tagData.tag ? '#3b82f6' : '#64748b',
                        '&:hover': {
                          backgroundColor: '#f1f5f9',
                          borderColor: '#6366f1',
                          color: '#6366f1',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                  {popularTags.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      No tags found
                    </Typography>
                  )}
                </Box>

                {/* Clear Filters */}
                {search && (
                  <Box mt={2} pt={2} borderTop="1px solid #f1f5f9">
                    <Button
                      size="small"
                      onClick={() => setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        next.delete('search');
                        next.set('page', '1');
                        return next;
                      })}
                      sx={{
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        color: '#64748b',
                        '&:hover': {
                          backgroundColor: '#f8fafc'
                        }
                      }}
                    >
                      Clear filter
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Community Overview */}
            <Card
              sx={{
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <span style={{ fontSize: '18px' }}>📈</span>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Community Overview
                  </Typography>
                </Box>

                {/* Quick Stats */}
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2563eb' }}>
                        {totalStats.total || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                        Posts
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#16a34a' }}>
                        {totalStats.items?.reduce((sum, post) => sum + (post.views || 0), 0) || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                        Views
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#7c3aed' }}>
                        {Object.keys(categoryStats).length || 5}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                        Categories
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Top Posts */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                  🔥 Top Posts
                </Typography>
                <Stack spacing={1.5}>
                  {totalStats.items?.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 2).map((post, index) => (
                    <Box
                      key={post._id}
                      onClick={() => navigate(`/post/${post._id}`)}
                      sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: '#fafbfc',
                        border: '1px solid #f1f5f9',
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                          borderColor: '#e2e8f0'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="caption" sx={{ backgroundColor: '#fef3c7', color: '#d97706', px: 1, py: 0.2, borderRadius: '6px', fontSize: '0.6rem', fontWeight: 600 }}>
                          #{index + 1}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 500, fontSize: '0.65rem' }}>
                          {post.views || 0} views
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: '#1e293b',
                          lineHeight: 1.2,
                          fontSize: '0.8rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {post.title}
                      </Typography>
                    </Box>
                  )) || (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1, fontSize: '0.8rem' }}>
                      No posts yet
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
