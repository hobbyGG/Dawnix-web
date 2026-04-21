import { Check, Loader2, MessageSquare, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useToast } from '../components/toast';
import { request } from '../lib/api';
import type { FormDataItem, Task, TimelineRecord } from '../types/workflow';

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const showToast = useToast();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await request('GET', '/task/list?scope=my_pending&page=1&size=50');
      setTasks(res.tasks || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCompleteTask = async (taskId: number, action: 'agree' | 'reject', opinion: string) => {
    try {
      await request('POST', `/task/complete/${taskId}`, { action, comment: opinion, form_data: [] });
      showToast('任务处理成功！', 'success');
      setSelectedTask(null);
      fetchTasks();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openTask = async (task: Task) => {
    setSelectedTask(task);
    const taskId = task.ID || task.id;
    if (!taskId) return;
    try {
      const detail = await request('GET', `/task/${taskId}`);
      setSelectedTask((prev) => (prev ? { ...prev, ...detail } : prev));
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-[#1e1e20] rounded-2xl border border-gray-200/60 dark:border-gray-800 h-[calc(100vh-140px)] flex flex-col shadow-sm overflow-hidden relative transition-colors">
      <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between bg-gray-50/50 dark:bg-[#18181a]">
        <h2 className="text-[14px] font-semibold text-gray-800 dark:text-white">我的待办任务</h2>
        <button onClick={fetchTasks} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800">
          刷新列表
        </button>
      </div>
      <div className="overflow-x-auto flex-1">
        {loading ? (
          <div className="text-center py-10 text-gray-400">加载中...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1e1e20] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3.5 font-medium">任务节点</th>
                <th className="px-6 py-3.5 font-medium">所属流程</th>
                <th className="px-6 py-3.5 font-medium">发起人</th>
                <th className="px-6 py-3.5 font-medium">到达时间</th>
                <th className="px-6 py-3.5 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    当前没有待办任务
                  </td>
                </tr>
              )}
              {tasks.map((row) => (
                <tr key={row.ID || row.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                    <span className="text-[13px]">{row.TaskName || row.task_name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-[12px]">{row.ProcessTitle || row.process_title}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-[12px]">{row.SubmitterName || row.submitter_name}</td>
                  <td className="px-6 py-4 text-gray-400 dark:text-gray-500 text-[11px]">{row.ArrivedAt || row.arrived_at}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openTask(row)}
                      className="text-blue-600 font-medium px-4 py-1.5 border border-blue-200 dark:border-blue-800 rounded-md text-[12px] hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      办理
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedTask && <TaskDrawer selectedTask={selectedTask} onClose={() => setSelectedTask(null)} onComplete={handleCompleteTask} />}
    </div>
  );
}

function TaskDrawer({
  selectedTask,
  onClose,
  onComplete,
}: {
  selectedTask: Task;
  onClose: () => void;
  onComplete: (id: number, action: 'agree' | 'reject', opinion: string) => Promise<void>;
}) {
  const [opinion, setOpinion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formData = selectedTask.FormData || selectedTask.form_data || [];
  const timeline = selectedTask.Timeline || selectedTask.timeline || [];

  const handleAction = async (action: 'agree' | 'reject') => {
    setSubmitting(true);
    await onComplete((selectedTask.ID || selectedTask.id)!, action, opinion);
    setSubmitting(false);
  };

  return (
    <>
      <div className="absolute inset-0 bg-gray-900/10 dark:bg-black/40 backdrop-blur-[2px] z-20" onClick={onClose}></div>
      <div className="absolute top-0 right-0 w-[440px] h-full bg-white dark:bg-[#1a1a1c] border-l border-gray-200 dark:border-gray-800 shadow-2xl z-30 transform transition-transform duration-300 flex flex-col fade-in">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedTask.TaskName || selectedTask.task_name}</h2>
          <div className="text-xs text-gray-500 mt-1">
            流程: {selectedTask.ProcessTitle || selectedTask.process_title} | 发起人: {selectedTask.SubmitterName || selectedTask.submitter_name}
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {formData.length > 0 ? (
            <div className="bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700 rounded-xl p-4 space-y-4">
              <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">全局表单数据</h4>
              {formData.map((item: FormDataItem, idx: number) => (
                <div key={item.id || idx}>
                  <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-1">{item.label}</div>
                  <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 shadow-sm">{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-[12px] py-2">此流程未附带表单数据</div>
          )}

          <div className="space-y-2">
            <h4 className="text-[12px] font-medium text-gray-800 dark:text-white flex items-center">
              审批意见 <span className="text-gray-400 text-[10px] ml-2 font-normal">(非必填)</span>
            </h4>
            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3 text-[13px] outline-none focus:border-blue-500 min-h-[80px]"
              placeholder="请输入审批意见..."
            />
          </div>

          {timeline.length > 0 && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">流转轨迹 (Timeline)</h4>
              <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-6 pb-4">
                {timeline.map((record: TimelineRecord) => (
                  <div key={record.id} className="relative pl-6">
                    <div
                      className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1a1a1c] flex items-center justify-center shadow-sm ${record.action === 'SUBMIT' ? 'bg-blue-500' : record.action === 'APPROVE' ? 'bg-green-500' : record.action === 'REJECT' ? 'bg-red-500' : 'bg-orange-400'}`}
                    >
                      {record.action === 'PENDING' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{record.node_name}</span>
                        <span className="text-[11px] text-gray-400 font-mono">{record.time}</span>
                      </div>
                      <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                        <User size={12} className="mr-1 opacity-70" /> {record.operator}
                        <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                        <span className={`font-medium ${record.action === 'APPROVE' ? 'text-green-600 dark:text-green-500' : record.action === 'REJECT' ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                          {record.action === 'SUBMIT' ? '发起审批' : record.action === 'APPROVE' ? '已同意' : record.action === 'REJECT' ? '已驳回' : '处理中'}
                        </span>
                      </div>
                      {record.comment && (
                        <div className="mt-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-md p-2.5 text-[12px] text-gray-600 dark:text-gray-300 flex items-start">
                          <MessageSquare size={14} className="mr-2 mt-0.5 text-gray-400 shrink-0" />
                          {record.comment}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a1a1c] flex justify-end space-x-3">
          <button
            disabled={submitting}
            onClick={() => handleAction('reject')}
            className="px-5 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            驳回
          </button>
          <button
            disabled={submitting}
            onClick={() => handleAction('agree')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
          >
            {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : <Check size={14} className="mr-1" />} 同意
          </button>
        </div>
      </div>
    </>
  );
}
