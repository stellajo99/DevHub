// frontend/src/components/Header.js
import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box,
  TextField, InputAdornment, Avatar, Badge, Tooltip, useMediaQuery, useTheme, Tabs, Tab, Chip
} from '@mui/material';
import {
  AccountCircle, Search as SearchIcon, Logout as LogoutIcon,
  Bookmark as BookmarkIcon, PostAdd as PostAddIcon, Code as CodeIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

function Header({ user, onLogout, categories = [], categoryStats = {} }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('search') || '');
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const category = searchParams.get('category') || '';

  const open = Boolean(anchorEl);
  const mobileMenuOpen = Boolean(mobileMenuAnchor);
  
  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleMobileMenu = (event) => setMobileMenuAnchor(event.currentTarget);
  const handleMobileMenuClose = () => setMobileMenuAnchor(null);

  const submitSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (keyword) params.set('search', keyword); else params.delete('search');
    setSearchParams(params);
  };

  const handleCategoryChange = (event, newValue) => {
    const params = new URLSearchParams(searchParams);
    if (newValue) {
      params.set('category', newValue);
    } else {
      params.delete('category');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const logout = () => {
    localStorage.removeItem('token');
    onLogout?.();
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Toolbar
        sx={{
          gap: { xs: 1, sm: 2 },
          minHeight: { xs: '48px', sm: '56px' },
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* Logo Section */}
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            cursor: 'pointer',
            flexShrink: 0,
            minWidth: 'fit-content'
          }}
          onClick={() => navigate('/')}
        >
          <CodeIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: '#ffffff' }} />
          {!isSmall && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #ffffff, #f0f0f0)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                fontSize: { xs: '1rem', sm: '1.2rem' }
              }}
            >
              DevHub
            </Typography>
          )}
        </Box>

        {/* Search Section - Hidden on very small screens */}
        {!isSmall && (
          <Box
            component="form"
            onSubmit={submitSearch}
            sx={{
              flex: 1,
              maxWidth: { xs: 300, md: 600 },
              mx: { xs: 1, sm: 3 },
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search posts..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  height: '36px',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffffff',
                  },
                  '& input': {
                    color: '#ffffff',
                    py: 0.5,
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.7)',
                    }
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        {/* Actions Section */}
        <Box
          display="flex"
          alignItems="center"
          gap={{ xs: 0.5, sm: 2 }}
          sx={{
            flexShrink: 0,
            minWidth: 'fit-content'
          }}
        >
          {user ? (
            <>
              {/* Desktop Actions */}
              {!isMobile && (
                <>
                  <Tooltip title="Write a new post">
                    <IconButton
                      color="inherit"
                      onClick={() => navigate('/write')}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        width: 36,
                        height: 36,
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.25)',
                        }
                      }}
                    >
                      <PostAddIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="My bookmarks">
                    <IconButton
                      color="inherit"
                      onClick={() => navigate('/bookmarks')}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        width: 36,
                        height: 36,
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.2)',
                        }
                      }}
                    >
                      <Badge
                        badgeContent={user?.bookmarks?.length || 0}
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.55rem',
                            minWidth: 14,
                            height: 14
                          }
                        }}
                      >
                        <BookmarkIcon sx={{ fontSize: 18 }} />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                </>
              )}

              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  color="inherit"
                  onClick={handleMobileMenu}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    width: 36,
                    height: 36,
                    mr: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                    }
                  }}
                >
                  <MenuIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}

              {/* Avatar */}
              <Tooltip title={`Welcome, ${user.nickname}`}>
                <IconButton
                  color="inherit"
                  onClick={handleMenu}
                  sx={{ p: 0.5 }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 28, sm: 32 },
                      height: { xs: 28, sm: 32 },
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {user.nickname?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>

              {/* User Menu */}
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <MenuItem
                  onClick={() => { handleClose(); navigate('/profile'); }}
                  sx={{ py: 1.5, px: 2 }}
                >
                  <AccountCircle fontSize="small" sx={{ mr: 1.5 }} />
                  Profile
                </MenuItem>
                <MenuItem
                  onClick={() => { handleClose(); logout(); }}
                  sx={{ py: 1.5, px: 2 }}
                >
                  <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                  Logout
                </MenuItem>
              </Menu>

              {/* Mobile Actions Menu */}
              <Menu
                anchorEl={mobileMenuAnchor}
                open={mobileMenuOpen}
                onClose={handleMobileMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <MenuItem
                  onClick={() => { handleMobileMenuClose(); navigate('/write'); }}
                  sx={{ py: 1.5, px: 2 }}
                >
                  <PostAddIcon fontSize="small" sx={{ mr: 1.5 }} />
                  Write Post
                </MenuItem>
                <MenuItem
                  onClick={() => { handleMobileMenuClose(); navigate('/bookmarks'); }}
                  sx={{ py: 1.5, px: 2 }}
                >
                  <BookmarkIcon fontSize="small" sx={{ mr: 1.5 }} />
                  Bookmarks
                  <Badge
                    badgeContent={user?.bookmarks?.length || 0}
                    color="error"
                    sx={{ ml: 'auto' }}
                  />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              {/* Auth Buttons */}
              <Button
                color="inherit"
                onClick={() => navigate('/auth')}
                sx={{
                  borderRadius: '20px',
                  px: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                Login
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/auth?tab=register')}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  px: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }
                }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>

      {/* Category Navigation Tabs */}
      {location.pathname === '/' && categories.length > 0 && (
        <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', px: { xs: 2, sm: 3 } }}>
          <Tabs
            value={category || false}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,
              '& .MuiTabs-indicator': {
                backgroundColor: '#ffffff',
                height: 2
              },
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600,
                fontSize: '0.875rem',
                minHeight: 48,
                textTransform: 'none',
                '&.Mui-selected': {
                  color: '#ffffff'
                },
                '&:hover': {
                  color: 'rgba(255,255,255,0.9)'
                }
              }
            }}
          >
            <Tab
              label={(
                <Box display="flex" alignItems="center" gap={1}>
                  <span>All Posts</span>
                  <Chip
                    label={Object.values(categoryStats).reduce((sum, count) => sum + count, 0) || 0}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      height: 18,
                      minWidth: 24
                    }}
                  />
                </Box>
              )}
              value={false}
            />
            {categories.map((cat) => (
              <Tab
                key={cat.name}
                label={(
                  <Box display="flex" alignItems="center" gap={1}>
                    <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <Chip
                      label={categoryStats[cat.name] || 0}
                      size="small"
                      sx={{
                        backgroundColor: category === cat.name ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        height: 18,
                        minWidth: 24
                      }}
                    />
                  </Box>
                )}
                value={cat.name}
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Mobile Search Bar */}
      {isSmall && (
        <Box
          component="form"
          onSubmit={submitSearch}
          sx={{
            px: 2,
            pb: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search posts..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: '25px',
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ffffff',
                },
                '& input': {
                  color: '#ffffff',
                  '&::placeholder': {
                    color: 'rgba(255,255,255,0.7)',
                  }
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}
    </AppBar>
  );
}

export default Header;