import { Bell, CheckSquare, GitBranch, History, LayoutDashboard, LogOut, Moon, PanelLeft, PlayCircle, Sun } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getStoredUserInfo } from '../lib/user';
import { Route, Routes, useLocation, useNavigate } from '../router/hash-router';
import type { UserInfo } from '../types/workflow';
import DashboardView from '../views/dashboard-view';
import DefinitionsManager from '../views/definitions-manager';
import InstancesView, { InstanceDetailView } from '../views/instances-view';
import RecordsView from '../views/records-view';
import TasksView from '../views/tasks-view';

interface AppLayoutProps {
  onLogout: () => void;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
}

export default function AppLayout({ onLogout, isDarkMode, setIsDarkMode }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const viewTitles: Record<string, string> = {
    '/dashboard': '工作台概览',
    '/definitions': '流程定义管理',
    '/instances': '流程实例监控',
    '/tasks': '任务中心',
    '/records': '审批历史',
  };
  const currentTitle = location.pathname.startsWith('/instances/') ? '流程实例详情' : viewTitles[location.pathname] || 'Dawnix';

  return (
    <div className={`flex h-screen w-full bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100 font-sans antialiased selection:bg-blue-200 overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} onLogout={onLogout} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#ffffff] dark:bg-[#121212]">
        <Header
          currentTitle={currentTitle}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
        <main className="flex-1 overflow-y-auto p-8 bg-[#fbfbfd] dark:bg-[#121212] relative">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/definitions" element={<DefinitionsManager />} />
            <Route path="/instances/:instanceId" element={<InstanceDetailView />} />
            <Route path="/instances" element={<InstancesView />} />
            <Route path="/tasks" element={<TasksView />} />
            <Route path="/records" element={<RecordsView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ isCollapsed, onLogout }: { isCollapsed: boolean; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<UserInfo>({});

  useEffect(() => {
    setUserInfo(getStoredUserInfo());
  }, []);

  const navItems = [
    { path: '/dashboard', label: '工作台概览', icon: <LayoutDashboard size={18} /> },
    { path: '/definitions', label: '流程定义', icon: <GitBranch size={18} /> },
    { path: '/instances', label: '流程实例', icon: <PlayCircle size={18} /> },
    { path: '/tasks', label: '任务管理', icon: <CheckSquare size={18} /> },
    { path: '/records', label: '审批历史', icon: <History size={18} /> },
  ];

  return (
    <div className={`transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] bg-[#f5f5f7]/80 dark:bg-[#1a1a1c]/80 backdrop-blur-2xl border-r border-gray-200/60 dark:border-gray-800/60 flex flex-col h-full z-20 ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      <div className={`px-6 pt-6 mb-6 flex items-center ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <h1 className="font-semibold text-lg text-gray-800 dark:text-white tracking-tight flex items-center whitespace-nowrap overflow-hidden">
          <div className="min-w-[24px] h-6 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-sm">D</div>
          <span className={`ml-2.5 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Dawnix</span>
        </h1>
      </div>
      <div className={`flex-1 px-3 space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
        <div className={`text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 ml-2 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
          核心业务
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center py-2 rounded-lg transition-all duration-150 text-sm active:scale-95 ${isCollapsed ? 'justify-center px-0' : 'px-3'} ${isActive ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-semibold border border-gray-200/60 dark:border-gray-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 font-medium border border-transparent'}`}
            >
              <span className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} opacity-90`}>{item.icon}</span>
              <span className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${isCollapsed ? 'opacity-0 w-0 ml-0' : 'opacity-100 w-auto ml-3'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="p-3">
        <div
          onClick={onLogout}
          className={`flex items-center p-2 rounded-xl hover:bg-red-50/80 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer active:scale-95 ${isCollapsed ? 'justify-center' : ''}`}
          title="退出登录"
        >
          <div className="w-9 h-9 min-w-[36px] bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-inner border border-gray-200/50 dark:border-gray-700/50">
            <LogOut size={16} />
          </div>
          <div className={`flex-1 overflow-hidden transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 ml-0' : 'opacity-100 ml-3'}`}>
            <p className="text-[13px] font-medium text-gray-800 dark:text-gray-200 truncate">{userInfo.display_name || userInfo.username || '当前用户'}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">@{userInfo.user_id || userInfo.username || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({
  currentTitle,
  isCollapsed,
  setIsCollapsed,
  isDarkMode,
  setIsDarkMode,
}: {
  currentTitle: string;
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <header className="h-14 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors">
      <div className="flex items-center text-gray-800 dark:text-white">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 mr-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors active:scale-90"
        >
          <PanelLeft size={18} />
        </button>
        <span className="font-semibold text-sm tracking-tight">{currentTitle}</span>
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="relative p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors active:scale-90"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="relative p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors active:scale-90">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
        </button>
      </div>
    </header>
  );
}
