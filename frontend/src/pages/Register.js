// frontend/src/pages/Register.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/auth?tab=register', { replace: true });
  }, [navigate]);
  return null;
}
