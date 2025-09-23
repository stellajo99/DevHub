// frontend/src/pages/PostDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, Button, IconButton, Tooltip, Card, CardContent, Avatar, Divider, Container } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Bookmark as BookmarkIcon, BookmarkBorder as BookmarkBorderIcon, Visibility as VisibilityIcon, AccessTime as TimeIcon, Person as PersonIcon } from '@mui/icons-material';
import api from '../services/api';
import CommentList from '../components/CommentList';

export default function PostDetail({ user, isAuthenticated, refreshUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const load = async () => {
    const { data } = await api.get(`/posts/${id}`);
    setPost(data);
    setIsBookmarked(user?.bookmarks?.includes(data._id) || false);
  };

  useEffect(() => { load(); }, [id, user]);

  const handleBookmark = async () => {
    if (!user) return;
    try {
      await api.post(`/posts/${id}/bookmark`);
      setIsBookmarked(!isBookmarked);
      if (refreshUser) {
        refreshUser();
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/post/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${id}`);
        navigate('/');
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  if (!post) return null;

  const isOwner = user && post.author && user._id === post.author._id;

  const getCategoryColor = (category) => {
    const colors = {
      'General': '#6366f1',
      'Q&A': '#10b981',
      'Showcase': '#f59e0b',
      'Jobs': '#ef4444',
      'Events': '#8b5cf6'
    };
    return colors[category] || '#6b7280';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Main Post Card */}
      <Card
        sx={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          mb: 4
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header Section */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box flex={1}>
              <Typography
                variant="h3"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  lineHeight: 1.2,
                  mb: 2
                }}
              >
                {post.title}
              </Typography>

              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Chip
                  label={post.category}
                  sx={{
                    backgroundColor: getCategoryColor(post.category),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    px: 1
                  }}
                />
                {post.tags?.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: '#cbd5e1',
                      color: '#475569',
                      '&:hover': {
                        backgroundColor: '#f1f5f9'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box display="flex" gap={1}>
              {user && (
                <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
                  <IconButton
                    onClick={handleBookmark}
                    sx={{
                      backgroundColor: isBookmarked ? '#fef2f2' : '#f8fafc',
                      color: isBookmarked ? '#dc2626' : '#64748b',
                      width: 48,
                      height: 48,
                      '&:hover': {
                        backgroundColor: isBookmarked ? '#fee2e2' : '#f1f5f9',
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Tooltip>
              )}

              {isOwner && (
                <>
                  <Tooltip title="Edit post">
                    <IconButton
                      onClick={handleEdit}
                      sx={{
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        width: 48,
                        height: 48,
                        '&:hover': {
                          backgroundColor: '#dbeafe',
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete post">
                    <IconButton
                      onClick={handleDelete}
                      sx={{
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        width: 48,
                        height: 48,
                        '&:hover': {
                          backgroundColor: '#fee2e2',
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>

          {/* Author & Meta Info */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              p: 3,
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              mb: 4
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  width: 50,
                  height: 50,
                  backgroundColor: getCategoryColor(post.category),
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
              >
                {post.author?.nickname?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  {post.author?.nickname || 'Unknown'}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <TimeIcon fontSize="small" sx={{ color: '#64748b' }} />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <VisibilityIcon sx={{ color: '#64748b' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#475569' }}>
                {post.views || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                views
              </Typography>
            </Box>
          </Box>

          {/* Content */}
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              fontSize: '1.1rem',
              color: '#334155',
              mb: 4
            }}
          >
            {post.content}
          </Typography>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card
        sx={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: '#1e293b',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            💬 Comments
          </Typography>
          <CommentList postId={post._id} canWrite={Boolean(user)} currentUser={user} />
        </CardContent>
      </Card>
    </Container>
  );
}
