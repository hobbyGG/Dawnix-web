import { Loader2, Moon, Sun } from 'lucide-react';
import React, { useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { request } from '../lib/api';
import type { UserInfo } from '../types/workflow';
import { useToast } from '../components/toast';

interface AuthViewProps {
  onLoginSuccess: () => void;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
}

export default function AuthView({ onLoginSuccess, isDarkMode, setIsDarkMode }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await request('POST', '/auth/signin', { username, password });
        localStorage.setItem('dawnix_access_token', res.access_token);
        const userInfo: UserInfo = res.user || {
          user_id: res.user_id || username,
          username,
          display_name: res.display_name || username,
        };
        localStorage.setItem('dawnix_user_info', JSON.stringify(userInfo));
        onLoginSuccess();
      } else {
        await request('POST', '/auth/signup', { username, password, display_name: displayName || undefined });
        showToast('注册成功！请登录', 'success');
        setIsLogin(true);
      }
    } catch (err: any) {
      showToast(err.message || (isLogin ? '登录失败，请检查账号密码' : '注册失败'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors ${isDarkMode ? 'dark' : ''}`}>
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-90 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transition-all">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-sm">D</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{isLogin ? '登录 Dawnix' : '注册 Dawnix'}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">企业级工作流引擎系统</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-2.5 bg-transparent border border-gray-300 dark:border-gray-600 dark:text-white rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all text-sm"
            />
          </div>
          {!isLogin && (
            <div className="fade-in">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">显示名称 (可选)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如：管理员"
                className="w-full p-2.5 bg-transparent border border-gray-300 dark:border-gray-600 dark:text-white rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2.5 bg-transparent border border-gray-300 dark:border-gray-600 dark:text-white rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all active:scale-95 flex items-center justify-center shadow-sm disabled:opacity-70 mt-4"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : isLogin ? '登 录' : '注 册'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
            }}
            className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          >
            {isLogin ? '立即注册' : '返回登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
