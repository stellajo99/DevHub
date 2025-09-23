// frontend/src/components/PostCard.js
import React from 'react';
import { Card, CardContent, Typography, Chip, Box, IconButton, Tooltip, Avatar, Fade } from '@mui/material';
import { Visibility as VisibilityIcon, Bookmark as BookmarkIcon, BookmarkBorder as BookmarkBorderIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function PostCard({ post, onToggleBookmark, isBookmarked }) {
  const navigate = useNavigate();
  const handleBookmark = (e) => {
    e.stopPropagation();
    onToggleBookmark?.(post._id);
  };

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
    <Fade in={true} timeout={300}>
      <Card
        onClick={() => navigate(`/post/${post._id}`)}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid #cbd5e1',
          }
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.2}>
            <Box flex={1}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  lineHeight: 1.2,
                  mb: 1,
                  fontSize: '1rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {post.title}
              </Typography>

              <Box display="flex" alignItems="center" gap={0.5} mb={1.2} sx={{ flexWrap: 'wrap' }}>
                <Chip
                  label={post.category}
                  size="small"
                  sx={{
                    backgroundColor: getCategoryColor(post.category),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    height: 24
                  }}
                />
                {post.tags?.slice(0, 2).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: '#cbd5e1',
                      color: '#475569',
                      fontSize: '0.65rem',
                      height: 24,
                      '&:hover': {
                        backgroundColor: '#f1f5f9'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
              <IconButton
                onClick={handleBookmark}
                size="small"
                sx={{
                  backgroundColor: isBookmarked ? '#fef2f2' : '#f8fafc',
                  color: isBookmarked ? '#dc2626' : '#64748b',
                  width: 32,
                  height: 32,
                  '&:hover': {
                    backgroundColor: isBookmarked ? '#fee2e2' : '#f1f5f9',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              lineHeight: 1.4,
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '0.8rem'
            }}
          >
            {post.content || 'No content available'}
          </Typography>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              pt: 1.2,
              borderTop: '1px solid #f1f5f9'
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                sx={{
                  width: 20,
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: getCategoryColor(post.category),
                }}
              >
                {post.author?.nickname?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                {post.author?.nickname || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                •
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={0.5}>
              <VisibilityIcon fontSize="small" sx={{ color: '#94a3b8', fontSize: '16px' }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, color: '#475569' }}
              >
                {post.views || 0}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}

export default PostCard;
