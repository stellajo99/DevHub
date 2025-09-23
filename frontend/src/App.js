// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthLanding from './pages/AuthLanding';
import PostDetail from './pages/PostDetail';
import PostWrite from './pages/PostWrite';
import PostEdit from './pages/PostEdit';
import Profile from './pages/Profile';
import Bookmarks from './pages/Bookmarks';
import api from './services/api';

function AppInner() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});

  const fetchMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const isAuthenticated = () => Boolean(localStorage.getItem('token'));
  const login = (data) => {
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };
  const register = (data) => {
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };
  const updateProfile = (u) => { setUser((prev) => ({ ...prev, ...u })); };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };
  const refreshUser = () => fetchMe();

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>
      <Header user={user} onLogout={logout} categories={categories} categoryStats={categoryStats} />
      <Box sx={{ width: '100%' }}>
        <Routes>
          <Route path="/" element={<Home user={user} refreshUser={refreshUser} categories={categories} setCategories={setCategories} categoryStats={categoryStats} setCategoryStats={setCategoryStats} />} />
          <Route path="/login" element={<Login onLogin={login} isAuthenticated={isAuthenticated} />} />
          <Route path="/register" element={<Register onRegister={register} isAuthenticated={isAuthenticated} />} />
          <Route path="/post/:id" element={<PostDetail user={user} isAuthenticated={isAuthenticated} refreshUser={refreshUser} />} />
          <Route path="/post/:id/edit" element={<PostEdit isAuthenticated={isAuthenticated} />} />
          <Route path="/write" element={<PostWrite isAuthenticated={isAuthenticated} />} />
          <Route path="/profile" element={<Profile user={user} onUpdateProfile={updateProfile} />} />
          <Route path="/bookmarks" element={<Bookmarks user={user} isAuthenticated={isAuthenticated} refreshUser={refreshUser} />} />
                  <Route path="/auth" element={<AuthLanding onLogin={login} onRegister={register} />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default function App() {
  // Add global styles to ensure full width
  React.useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
    document.body.style.overflowX = 'auto';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.width = '100%';
  }, []);

  // Wrap in BrowserRouter in case not already present at entry
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
