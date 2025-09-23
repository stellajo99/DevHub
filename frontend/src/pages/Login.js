// frontend/src/pages/Login.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/auth?tab=login', { replace: true });
  }, [navigate]);
  return null;
}
