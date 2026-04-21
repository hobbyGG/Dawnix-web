import { ArrowLeft, GitCommit, Loader2, MessageSquare, Play, Plus, StopCircle, User, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { StartInstanceDrawer } from '../components/start-instance-drawer';
import { useToast } from '../components/toast';
import { normalizeDefinition } from '../lib/definition';
import { request } from '../lib/api';
import { useNavigate, useParams } from '../router/hash-router';
import type { Definition, FormDataItem, Instance, InstanceDetailResponse, InstanceExecution, TimelineRecord } from '../types/workflow';

function renderInstanceStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <span className="px-2.5 py-1 bg-orange-100/80 text-orange-700 text-[11px] font-medium rounded-md border border-orange-200/60">运行中</span>;
    case 'APPROVED':
      return <span className="px-2.5 py-1 bg-green-100/80 text-green-700 text-[11px] font-medium rounded-md border border-green-200/60">已批准</span>;
    case 'REJECTED':
      return <span className="px-2.5 py-1 bg-red-100/80 text-red-700 text-[11px] font-medium rounded-md border border-red-200/60">已驳回</span>;
    default:
      return <span className="px-2.5 py-1 bg-gray-100/80 text-gray-600 text-[11px] font-medium rounded-md border border-gray-200/60">{status || '未知'}</span>;
  }
}

function mapExecutionTimeline(executions: InstanceExecution[], instanceId: string): TimelineRecord[] {
  return executions.map((execution: InstanceExecution, idx: number) => ({
    id: String(execution.ID || execution.id || `${instanceId}_${idx}`),
    node_name: execution.NodeID || execution.node_id || '执行节点',
    operator: '-',
    action: execution.IsActive || execution.is_active ? 'PENDING' : 'SUBMIT',
    time: execution.UpdatedAt || execution.updated_at || execution.CreatedAt || execution.created_at || '',
  }));
}

export default function InstancesView() {
  const navigate = useNavigate();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [startableDefs, setStartableDefs] = useState<Definition[]>([]);
  const [loadingDefs, setLoadingDefs] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [startingDef, setStartingDef] = useState<Definition | null>(null);
  const showToast = useToast();

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const res = await request('GET', '/instance/list?page=1&size=50');
      setInstances(Array.isArray(res) ? res : []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchInstances();
  }, []);

  const openDetail = (instance: Instance) => {
    const instanceId = instance.ID || instance.id;
    if (!instanceId) {
      showToast('实例ID缺失，无法打开详情', 'error');
      return;
    }
    navigate(`/instances/${instanceId}`);
  };

  const handleStartProcessClick = async () => {
    setLoadingDefs(true);
    try {
      const res = await request('GET', '/definition/list?page=1&size=50');
      const list = (res.list || []).map((item: Definition) => normalizeDefinition(item));
      const activeList = list.filter((d: Definition) => d.IsActive !== false && d.is_active !== false);
      setStartableDefs(activeList);
      setShowStartPicker(true);
      if (activeList.length === 0) {
        showToast('暂无可发起流程，请先在流程定义中发布流程', 'info');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingDefs(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-[#1e1e20] rounded-2xl border border-gray-200/60 dark:border-gray-800 h-[calc(100vh-140px)] flex flex-col shadow-sm overflow-hidden transition-colors relative">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-[#18181a]">
        <h2 className="font-semibold text-gray-800 dark:text-white text-[14px]">实例监控 (Instances)</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartProcessClick}
            disabled={loadingDefs}
            className="flex items-center px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-md transition-all active:scale-95 disabled:opacity-70"
          >
            {loadingDefs ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Plus size={13} className="mr-1.5" />}
            新建流程
          </button>
          <button onClick={fetchInstances} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            刷新数据
          </button>
        </div>
      </div>
      <div className="overflow-x-auto flex-1 p-1">
        {loading ? (
          <div className="text-center py-10 text-gray-400">加载中...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1e1e20]">
              <tr>
                <th className="px-5 py-3.5 font-medium">实例 ID</th>
                <th className="px-5 py-3.5 font-medium">所属流程</th>
                <th className="px-5 py-3.5 font-medium">发起人 ID</th>
                <th className="px-5 py-3.5 font-medium">状态</th>
                <th className="px-5 py-3.5 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {instances.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    无运行实例
                  </td>
                </tr>
              )}
              {instances.map((row) => (
                <tr key={row.ID || row.id} onClick={() => openDetail(row)} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                  <td className="px-5 py-3.5 text-gray-500 font-mono text-[12px]">#{row.ID || row.id}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{row.ProcessName || row.process_name || row.ProcessCode || row.process_code}</div>
                    {(row.ProcessName || row.process_name) && <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{row.ProcessCode || row.process_code}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-[12px]">{row.SubmitterID || row.submitter_id}</td>
                  <td className="px-5 py-3.5">{renderInstanceStatusBadge(row.Status || row.status || '')}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(row);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium text-[12px] px-3 py-1.5 border border-transparent hover:border-blue-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all active:scale-95"
                    >
                      详情与轨迹
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showStartPicker && (
        <StartDefinitionPicker
          definitions={startableDefs}
          onClose={() => setShowStartPicker(false)}
          onGoDefinitions={() => navigate('/definitions')}
          onSelect={(def: Definition) => {
            setShowStartPicker(false);
            setStartingDef(def);
          }}
        />
      )}
      {startingDef && <StartInstanceDrawer def={startingDef} onClose={() => { setStartingDef(null); fetchInstances(); }} />}
    </div>
  );
}

function StartDefinitionPicker({
  definitions,
  onClose,
  onSelect,
  onGoDefinitions,
}: {
  definitions: Definition[];
  onClose: () => void;
  onSelect: (def: Definition) => void;
  onGoDefinitions: () => void;
}) {
  return (
    <>
      <div className="absolute inset-0 bg-gray-900/10 dark:bg-black/40 backdrop-blur-[2px] z-20" onClick={onClose}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[calc(100%-32px)] max-h-[70vh] bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-gray-800 shadow-2xl z-30 rounded-xl overflow-hidden fade-in">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 flex justify-between items-center">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">选择要发起的流程</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">仅展示可发起的已发布流程定义</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors active:scale-90">
            <X size={17} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(70vh-72px)]">
          {definitions.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">暂无可发起流程</div>
              <button onClick={onGoDefinitions} className="mt-4 text-[12px] text-blue-600 dark:text-blue-400 hover:underline">
                前往流程定义管理
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {definitions.map((def) => {
                const name = def.Name || def.name || def.Code || def.code || '未命名流程';
                const code = def.Code || def.code || '-';
                const version = def.Version || def.version || 1;
                return (
                  <button
                    key={def.ID || def.id || code}
                    onClick={() => onSelect(def)}
                    className="w-full flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors text-left"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-1">
                        {code} • v{version}.0
                      </div>
                    </div>
                    <span className="text-[12px] text-blue-600 dark:text-blue-400 font-medium flex items-center">
                      <Play size={12} className="mr-1" /> 发起
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function InstanceDetailView() {
  const navigate = useNavigate();
  const { instanceId } = useParams<{ instanceId: string }>();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [instance, setInstance] = useState<Instance | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      const detail: InstanceDetailResponse | Instance = await request('GET', `/instance/${instanceId}`);
      const detailInst: Instance = (detail as InstanceDetailResponse).inst || (detail as Instance);
      const executions = Array.isArray((detail as InstanceDetailResponse).executions) ? (detail as InstanceDetailResponse).executions || [] : [];
      const mappedTimeline = mapExecutionTimeline(executions, instanceId);
      if (mappedTimeline.length > 0) {
        setInstance({ ...detailInst, Timeline: mappedTimeline });
      } else {
        setInstance(detailInst);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [instanceId, showToast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleTerminate = async () => {
    if (!instanceId) return;
    if (!window.confirm('确认强行终止该实例吗？')) return;
    setTerminating(true);
    try {
      await request('DELETE', `/instance/${instanceId}`);
      showToast('已强行终止该实例', 'success');
      navigate('/instances');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setTerminating(false);
    }
  };

  if (!instanceId) {
    return <div className="max-w-6xl mx-auto p-6 text-center text-gray-500">实例ID无效</div>;
  }

  const formData = instance?.FormData || instance?.form_data || [];
  const timeline = instance?.Timeline || instance?.timeline || [];
  const status = instance?.Status || instance?.status || '';

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col fade-in">
      <div className="flex items-center justify-between mb-5 pt-2">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/instances')}
            className="mr-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">流程实例详情</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">实例 #{instanceId}</p>
          </div>
        </div>
        <button onClick={fetchDetail} disabled={loading} className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-70">
          刷新详情
        </button>
      </div>

      <div className="bg-white dark:bg-[#1e1e20] rounded-2xl border border-gray-200/60 dark:border-gray-800 flex-1 min-h-0 flex flex-col overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-10 text-gray-400">加载中...</div>
        ) : !instance ? (
          <div className="text-center py-10 text-gray-400">未找到实例详情</div>
        ) : (
          <>
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 flex justify-between items-start">
              <div>
                <div className="text-[11px] text-gray-400 font-mono font-semibold uppercase tracking-wider mb-1 flex items-center">
                  <GitCommit size={12} className="mr-1" /> Instance #{(instance.ID || instance.id)!}
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight flex items-center">
                  {instance.ProcessName || instance.process_name || instance.ProcessCode || instance.process_code}
                  <span className="ml-3">{renderInstanceStatusBadge(status)}</span>
                </h2>
                <div className="text-[12px] text-gray-500 mt-2 flex items-center">
                  发起人：<span className="font-medium text-gray-700 dark:text-gray-300 mx-1">{instance.SubmitterID || instance.submitter_id}</span> ({instance.CreatedAt || instance.created_at})
                </div>
              </div>
              {status === 'PENDING' && (
                <button
                  onClick={handleTerminate}
                  disabled={terminating}
                  className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 text-[12px] font-medium rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-all active:scale-95 disabled:opacity-70 flex items-center"
                >
                  {terminating ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <StopCircle size={13} className="mr-1.5" />}
                  强行终止
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#fbfbfd] dark:bg-[#121212]">
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
                <div className="text-center text-gray-400 text-[12px] py-4">该实例未包含表单数据</div>
              )}

              {timeline.length > 0 ? (
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
              ) : (
                <div className="text-center text-gray-400 text-[12px] py-4 border-t border-gray-100 dark:border-gray-800">暂无流转轨迹</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
