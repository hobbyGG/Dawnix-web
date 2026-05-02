import { Clock3, Filter, History, Loader2, MessageSquare, Search, User } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../components/toast';
import { request } from '../lib/api';
import type { ApprovalRecord } from '../types/workflow';

const RECORD_API_PATH = '/record/create';

function normalizeAction(action?: string) {
  if (!action) return 'unknown';
  const lowered = action.toLowerCase();
  if (lowered === 'agree' || lowered === 'approve') return 'agree';
  if (lowered === 'reject' || lowered === 'refuse') return 'reject';
  return lowered;
}

function formatActionLabel(action?: string) {
  const normalized = normalizeAction(action);
  if (normalized === 'agree') return '同意';
  if (normalized === 'reject') return '驳回';
  return action || '未知';
}

function getActionBadgeClass(action?: string) {
  const normalized = normalizeAction(action);
  if (normalized === 'agree') return 'bg-green-100/80 text-green-700 border-green-200/60 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900';
  if (normalized === 'reject') return 'bg-red-100/80 text-red-700 border-red-200/60 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900';
  return 'bg-gray-100/80 text-gray-600 border-gray-200/60 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
}

function formatTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}

function getRecordId(record: ApprovalRecord) {
  return record.ID || record.id || 0;
}

function extractRecords(res: any): ApprovalRecord[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.list)) return res.list;
  if (Array.isArray(res?.records)) return res.records;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

export default function RecordsView() {
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [instanceId, setInstanceId] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'agree' | 'reject'>('all');
  const [selectedRecord, setSelectedRecord] = useState<ApprovalRecord | null>(null);
  const showToast = useToast();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (instanceId.trim()) query.set('instance_id', instanceId.trim());
      query.set('page', '1');
      query.set('size', '100');
      const res = await request('GET', `${RECORD_API_PATH}?${query.toString()}`);
      setRecords(extractRecords(res));
      setSelectedRecord(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRecords = useMemo(() => {
    if (actionFilter === 'all') return records;
    return records.filter((record) => normalizeAction(record.Action || record.action) === actionFilter);
  }, [actionFilter, records]);

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-[#1e1e20] rounded-2xl border border-gray-200/60 dark:border-gray-800 h-[calc(100vh-140px)] flex flex-col shadow-sm overflow-hidden relative transition-colors">
      <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50/60 dark:bg-[#18181a] flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white flex items-center">
            <History size={16} className="mr-2 text-blue-600 dark:text-blue-400" /> 审批历史
          </h1>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">查看用户通过或驳回后的审批轨迹记录</p>
        </div>
        <button onClick={fetchRecords} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center">
          <Loader2 size={12} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> 刷新
        </button>
      </div>

      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1e1e20]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">实例 ID</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                placeholder="输入实例 ID 过滤，如 10001"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">动作</label>
            <div className="flex gap-2">
              {(['all', 'agree', 'reject'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setActionFilter(item)}
                  className={`px-3.5 py-2 rounded-lg border text-[12px] font-medium transition-colors ${actionFilter === item ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
                >
                  {item === 'all' ? '全部' : item === 'agree' ? '同意' : '驳回'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 md:justify-end">
            <button
              onClick={() => {
                setInstanceId('');
                setActionFilter('all');
                setSelectedRecord(null);
                request('GET', `${RECORD_API_PATH}?page=1&size=100`)
                  .then((res) => setRecords(extractRecords(res)))
                  .catch((err) => showToast(err.message, 'error'));
              }}
              className="inline-flex items-center px-3.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[12px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Filter size={14} className="mr-1.5" /> 重置筛选
            </button>
            <button onClick={fetchRecords} className="inline-flex items-center px-3.5 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700 transition-colors">
              查询
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <Loader2 size={18} className="animate-spin mr-2" /> 加载中...
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1e1e20] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3.5 font-medium">时间</th>
                <th className="px-6 py-3.5 font-medium">实例 ID</th>
                <th className="px-6 py-3.5 font-medium">任务 ID</th>
                <th className="px-6 py-3.5 font-medium">节点</th>
                <th className="px-6 py-3.5 font-medium">审批人</th>
                <th className="px-6 py-3.5 font-medium">动作</th>
                <th className="px-6 py-3.5 font-medium text-right">查看</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    暂无审批历史记录
                  </td>
                </tr>
              )}
              {filteredRecords.map((record) => {
                const recordId = getRecordId(record);
                return (
                  <tr key={recordId || `${record.InstanceID || record.instance_id}_${record.TaskID || record.task_id}_${record.CreatedAt || record.created_at}`} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-[12px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatTime(record.CreatedAt || record.created_at)}</td>
                    <td className="px-6 py-4 text-[12px] text-gray-600 dark:text-gray-300 font-mono">{record.InstanceID || record.instance_id || '-'}</td>
                    <td className="px-6 py-4 text-[12px] text-gray-600 dark:text-gray-300 font-mono">{record.TaskID || record.task_id || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{record.NodeName || record.node_name || '-'}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{record.NodeID || record.node_id || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-[12px] text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <User size={12} className="mr-1.5 text-gray-400" /> {record.ApproverName || record.approver_name || record.ApproverUID || record.approver_uid || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[11px] font-medium ${getActionBadgeClass(record.Action || record.action)}`}>
                        {formatActionLabel(record.Action || record.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium text-[12px] px-3 py-1.5 border border-transparent hover:border-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all active:scale-95"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedRecord && <RecordDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </div>
  );
}

function RecordDrawer({ record, onClose }: { record: ApprovalRecord; onClose: () => void }) {
  return (
    <>
      <div className="absolute inset-0 bg-gray-900/10 dark:bg-black/40 backdrop-blur-[2px] z-20" onClick={onClose}></div>
      <div className="absolute top-0 right-0 w-[460px] h-full bg-white dark:bg-[#1a1a1c] border-l border-gray-200 dark:border-gray-800 shadow-2xl z-30 transform transition-transform duration-300 flex flex-col fade-in">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock3 size={16} className="mr-2 text-blue-600 dark:text-blue-400" /> 审批记录详情
          </h2>
          <div className="text-xs text-gray-500 mt-1">记录 ID: {record.ID || record.id || '-'}</div>
        </div>

        <div className="flex-1 p-6 space-y-5 overflow-y-auto">
          <InfoRow label="实例 ID" value={String(record.InstanceID || record.instance_id || '-')} />
          <InfoRow label="任务 ID" value={String(record.TaskID || record.task_id || '-')} />
          <InfoRow label="节点名称" value={record.NodeName || record.node_name || '-'} />
          <InfoRow label="节点 ID" value={record.NodeID || record.node_id || '-'} />
          <InfoRow label="审批人" value={record.ApproverName || record.approver_name || record.ApproverUID || record.approver_uid || '-'} />
          <InfoRow label="审批动作" value={formatActionLabel(record.Action || record.action)} />
          <div>
            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">审批意见</div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 text-[13px] text-gray-700 dark:text-gray-200 min-h-[88px] flex items-start">
              <MessageSquare size={14} className="mr-2 mt-0.5 text-gray-400 shrink-0" />
              <span>{record.Comment || record.comment || '无'}</span>
            </div>
          </div>
          <InfoRow label="创建时间" value={formatTime(record.CreatedAt || record.created_at)} />
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{label}</div>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-[13px] text-gray-800 dark:text-gray-200">{value}</div>
    </div>
  );
}
