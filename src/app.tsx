import React, { useEffect, useState } from 'react';
import { ToastProvider, useToast } from './components/toast';
import { request } from './lib/api';
import AppLayout from './layout/app-layout';
import { HashRouter } from './router/hash-router';
import AuthView from './views/auth-view';

export default function DawnixApp() {
  return (
    <ToastProvider>
      <DawnixAppInner />
    </ToastProvider>
  );
}

function DawnixAppInner() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('dawnix_access_token'));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('dawnix_theme') === 'dark');
  const showToast = useToast();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dawnix_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dawnix_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleAuthError = () => {
      setIsAuthenticated(false);
      showToast('身份验证已过期，请重新登录', 'error');
    };
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, [showToast]);

  const handleLogout = async () => {
    try {
      await request('POST', '/auth/logout');
    } catch (err) {
      console.warn('Logout API failed or network error.', err);
    } finally {
      localStorage.removeItem('dawnix_access_token');
      localStorage.removeItem('dawnix_user_info');
      setIsAuthenticated(false);
      showToast('已安全退出系统', 'success');
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthView
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          showToast('登录成功', 'success');
        }}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  return (
    <HashRouter>
      <AppLayout onLogout={handleLogout} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
    </HashRouter>
  );
}
