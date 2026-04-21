import { CheckCircle2, CheckSquare, ChevronRight, Clock, FileText, GitBranch, Play, PlayCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { StartInstanceDrawer } from '../components/start-instance-drawer';
import { useToast } from '../components/toast';
import { normalizeDefinition } from '../lib/definition';
import { request } from '../lib/api';
import { getStoredUserInfo } from '../lib/user';
import { useNavigate } from '../router/hash-router';
import type { Definition, Instance } from '../types/workflow';

export default function DashboardView() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [currentUserName, setCurrentUserName] = useState('用户');
  const [activeDefs, setActiveDefs] = useState<Definition[]>([]);
  const [stats, setStats] = useState<{ pending: number; active: number; completed: number; definitions: number }>({
    pending: 0,
    active: 0,
    completed: 0,
    definitions: 0,
  });
  const [startingDef, setStartingDef] = useState<Definition | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('夜深了，注意休息');
    else if (hour < 12) setGreeting('早安');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');
    setDateStr(new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }));
    const userInfo = getStoredUserInfo();
    setCurrentUserName(userInfo.display_name || userInfo.username || userInfo.user_id || '用户');

    (async () => {
      const [defsResult, tasksResult, instancesResult] = await Promise.allSettled([
        request('GET', '/definition/list?page=1&size=50'),
        request('GET', '/task/list?scope=my_pending&page=1&size=1'),
        request('GET', '/instance/list?page=1&size=100'),
      ]);

      if (cancelled) return;

      if (defsResult.status === 'fulfilled') {
        const list = (defsResult.value.list || []).map((item: Definition) => normalizeDefinition(item));
        const activeList = list.filter((d: Definition) => d.IsActive !== false && d.is_active !== false);
        setActiveDefs(activeList.slice(0, 5));
        setStats((prev) => ({ ...prev, definitions: defsResult.value.total ?? list.length }));
      } else {
        showToast(defsResult.reason?.message || '流程定义加载失败', 'error');
      }

      if (tasksResult.status === 'fulfilled') {
        setStats((prev) => ({ ...prev, pending: tasksResult.value.total ?? (tasksResult.value.tasks || []).length }));
      } else {
        showToast(tasksResult.reason?.message || '任务统计加载失败', 'error');
      }

      if (instancesResult.status === 'fulfilled') {
        const instanceList: Instance[] = Array.isArray(instancesResult.value) ? instancesResult.value : [];
        const active = instanceList.filter((ins: Instance) => (ins.Status || ins.status) === 'PENDING').length;
        const completed = instanceList.filter((ins: Instance) => (ins.Status || ins.status) !== 'PENDING').length;
        setStats((prev) => ({ ...prev, active, completed }));
      } else {
        showToast(instancesResult.reason?.message || '实例统计加载失败', 'error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-8">
      <div className="pt-2">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white transition-colors">
          {greeting}，{currentUserName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1.5 transition-colors">{dateStr} · 您的工作流引擎运转正常</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard title="待办任务" value={stats.pending} icon={<Clock className="text-orange-500" />} isAlert />
        <StatCard title="活跃实例" value={stats.active} icon={<PlayCircle className="text-blue-500" />} />
        <StatCard title="已办结" value={stats.completed} icon={<CheckCircle2 className="text-green-500" />} />
        <StatCard title="流程定义" value={stats.definitions} icon={<GitBranch className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1e1e20] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm">快捷发起流程</h2>
            <button onClick={() => navigate('/definitions')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              全部
            </button>
          </div>
          <div className="space-y-2">
            {activeDefs.length === 0 && <div className="text-center text-xs text-gray-400 py-6">暂无可用流程，请前往定义管理发布新流程</div>}
            {activeDefs.map((def) => (
              <div key={def.ID || def.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group active:scale-[0.98]">
                <div className="flex items-center">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mr-3 border bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 mb-0.5">{def.Name || def.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{def.Code || def.code}</div>
                  </div>
                </div>
                <button
                  onClick={() => setStartingDef(def)}
                  className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95 shadow-sm border border-blue-100 dark:border-blue-800 flex items-center"
                >
                  <Play size={12} className="mr-1" /> 发起
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#1e1e20] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 shadow-sm flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm">我的待办快捷入口</h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center font-medium px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors active:scale-95"
            >
              前往任务中心 <ChevronRight size={14} className="ml-0.5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <CheckSquare size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-[13px]">请前往「任务管理」集中处理待办</p>
            </div>
          </div>
        </div>
      </div>

      {startingDef && <StartInstanceDrawer def={startingDef} onClose={() => setStartingDef(null)} />}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  isAlert,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  isAlert?: boolean;
}) {
  return (
    <div
      className={`bg-white dark:bg-[#1e1e20] p-5 rounded-2xl border ${isAlert ? 'border-orange-200/80 dark:border-orange-800/50 shadow-[0_2px_12px_rgba(255,165,0,0.08)]' : 'border-gray-200/60 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'} flex flex-col justify-between hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-shadow`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl shadow-sm border ${isAlert ? 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-100/50 dark:border-gray-700'}`}>
          {icon}
        </div>
        {trend && (
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded border ${trendUp ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'}`}
          >
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-gray-500 dark:text-gray-400 text-[12px] font-medium mb-0.5">{title}</h3>
        <p className={`text-[28px] font-semibold tracking-tight ${isAlert ? 'text-orange-600 dark:text-orange-500' : 'text-gray-800 dark:text-white'}`}>{value}</p>
      </div>
    </div>
  );
}
