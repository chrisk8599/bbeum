'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const userData = await authAPI.getMe();
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        Cookies.remove('token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    Cookies.set('token', data.access_token, { expires: 7 });
    setUser(data.user);
    
    // Redirect based on user type
    if (data.user.user_type === 'vendor') {
      router.push('/vendor/dashboard');
    } else {
      router.push('/browse');
    }
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    Cookies.set('token', data.access_token, { expires: 7 });
    setUser(data.user);
    
    // Redirect based on user type
    if (data.user.user_type === 'vendor') {
      router.push('/vendor/setup');
    } else {
      router.push('/browse');
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);