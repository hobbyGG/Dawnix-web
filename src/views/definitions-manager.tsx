import {
  ArrowLeft,
  ChevronRight,
  Circle,
  Component,
  Edit2,
  GitBranch,
  LayoutTemplate,
  Loader2,
  Mail,
  Maximize,
  Plus,
  Send,
  StopCircle,
  Trash2,
  User,
  Workflow,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { Dispatch, DragEvent, MouseEvent, ReactNode, SetStateAction } from 'react';
import { useToast } from '../components/toast';
import ApproverSelector from '../components/approver-selector';
import { normalizeDefinition } from '../lib/definition';
import { request } from '../lib/api';
import type { Definition, FlowEdge, FlowNode, FormField, NodeTypeOption } from '../types/workflow';

export default function DefinitionsManager() {
  const [viewState, setViewState] = useState<'list' | 'editor'>('list');
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDef, setEditingDef] = useState<Definition | null>(null);
  const showToast = useToast();

  const fetchDefs = async () => {
    setLoading(true);
    try {
      const res = await request('GET', '/definition/list?page=1&size=50');
      setDefinitions((res.list || []).map((item: Definition) => normalizeDefinition(item)));
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (viewState === 'list') fetchDefs();
  }, [viewState]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认删除该流程定义吗？')) return;
    try {
      await request('DELETE', `/definition/${id}`);
      showToast('删除成功', 'success');
      fetchDefs();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (viewState === 'editor') return <DefinitionEditorView def={editingDef} onBack={() => setViewState('list')} />;

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col fade-in relative">
      <div className="flex justify-between items-center mb-5 pt-2">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">流程定义</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">设计表单与审批流转规则。</p>
        </div>
        <button onClick={() => { setEditingDef(null); setViewState('editor'); }} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg transition-all active:scale-95 shadow-sm">
          <Plus size={16} className="mr-1.5" />
          新建模型
        </button>
      </div>

      <div className="bg-white dark:bg-[#1e1e20] rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-sm flex-1 overflow-hidden flex flex-col transition-colors">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <Loader2 className="animate-spin mr-2" /> 加载中...
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-5 py-3 font-medium">流程模型</th>
                  <th className="px-5 py-3 font-medium">标识符 (Code)</th>
                  <th className="px-5 py-3 font-medium">版本</th>
                  <th className="px-5 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {definitions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-400 dark:text-gray-500">
                      暂无数据
                    </td>
                  </tr>
                )}
                {definitions.map((row) => (
                  <tr key={row.ID || row.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800 dark:text-gray-200 text-[13px] flex items-center">
                        <Workflow size={14} className="mr-2 text-blue-500" /> {row.Name || row.name}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-[12px] font-mono">{row.Code || row.code}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-[12px]">v{row.Version || row.version}.0</td>
                    <td className="px-5 py-4 text-right space-x-1.5">
                      <button onClick={() => { setEditingDef(row); setViewState('editor'); }} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md transition-colors" title="配置设计">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete((row.ID || row.id)!)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-md transition-colors" title="删除">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function DefinitionEditorView({ def, onBack }: { def: Definition | null; onBack: () => void }) {
  const isNew = !def;
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<'form' | 'flow'>('form');

  const [code, setCode] = useState(def?.Code || def?.code || `flow_${Date.now()}`);
  const [name, setName] = useState(def?.Name || def?.name || '未命名流程');

  const structure = def?.Structure || def?.structure || { nodes: [{ id: 'start_1', type: 'start', name: '开始', x: 300, y: 100 }], edges: [] };
  const [formFields, setFormFields] = useState<FormField[]>(def?.FormDefinition || def?.form_definition || []);
  const [nodes, setNodes] = useState<FlowNode[]>(structure.nodes || []);
  const [edges, setEdges] = useState<FlowEdge[]>(structure.edges || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !code) return showToast('流程名称和Code不能为空', 'error');
    setSaving(true);
    const payload = { code, name, structure: { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } }, form_definition: formFields };
    try {
      if (isNew) {
        await request('POST', '/definition/create', payload);
      } else {
        const id = def!.ID || def!.id;
        await request('PUT', `/definition/${id}`, payload);
      }
      showToast('流程保存成功！', 'success');
      onBack();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col fade-in mx-auto w-full relative">
      <div className="flex justify-between items-center mb-4 pt-1 bg-white dark:bg-[#1e1e20] p-3 rounded-xl border border-gray-200/60 dark:border-gray-800 shadow-sm transition-colors">
        <div className="flex items-center w-1/3">
          <button onClick={onBack} className="mr-3 p-1.5 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all active:scale-90">
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col space-y-1">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="流程名称" className="text-[15px] font-semibold text-gray-900 dark:text-white outline-none placeholder-gray-300 dark:placeholder-gray-600 bg-transparent w-48" />
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} disabled={!isNew} placeholder="流程Code" className="text-[10px] text-gray-400 dark:text-gray-500 font-mono outline-none bg-transparent w-48" />
          </div>
        </div>
        <div className="flex bg-gray-100/80 dark:bg-gray-800 p-1 rounded-lg border border-gray-200/50 dark:border-gray-700 justify-center">
          <button onClick={() => setActiveTab('form')} className={`flex items-center px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${activeTab === 'form' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <LayoutTemplate size={14} className="mr-1.5" /> 表单设计
          </button>
          <button onClick={() => setActiveTab('flow')} className={`flex items-center px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${activeTab === 'flow' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <GitBranch size={14} className="mr-1.5" /> 流程编排
          </button>
        </div>
        <div className="flex space-x-2 justify-end w-1/3">
          <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 bg-blue-600 text-white text-[13px] font-medium rounded-md hover:bg-blue-700 shadow-sm transition-colors active:scale-95 flex items-center disabled:opacity-70">
            {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Send size={14} className="mr-1.5" />} 保存发布
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-[#1e1e20] rounded-xl border border-gray-200/60 dark:border-gray-800 relative overflow-hidden flex shadow-sm transition-colors">
        {activeTab === 'form' && <FormBuilder fields={formFields} setFields={setFormFields} />}
        {activeTab === 'flow' && <WorkflowCanvas nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />}
      </div>
    </div>
  );
}

function FormBuilder({ fields, setFields }: { fields: FormField[]; setFields: Dispatch<SetStateAction<FormField[]>> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addField = (type: string, label: string) => {
    const newField: FormField = { id: `field_${Date.now()}`, type, label, required: false, options: type === 'select' ? ['选项1', '选项2'] : [] };
    setFields([...fields, newField]);
    setSelectedId(newField.id);
  };
  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };
  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };
  const selField = fields.find((f) => f.id === selectedId);

  return (
    <div className="w-full h-full flex overflow-hidden">
      <div className="w-[200px] border-r border-gray-200/60 dark:border-gray-800 bg-gray-50/50 dark:bg-[#18181a] p-3 grid grid-cols-2 gap-2 content-start transition-colors">
        <div className="col-span-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2">基础控件</div>
        <button onClick={() => addField('input', '单行文本')} className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded text-[11px] hover:border-blue-400">
          单行文本
        </button>
        <button onClick={() => addField('number', '数字')} className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded text-[11px] hover:border-blue-400">
          数字
        </button>
        <button onClick={() => addField('select', '下拉选择')} className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded text-[11px] hover:border-blue-400 col-span-2">
          下拉单选框
        </button>
      </div>
      <div className="flex-1 bg-[#f5f5f7] dark:bg-[#121212] p-8 overflow-y-auto transition-colors" onClick={() => setSelectedId(null)}>
        <div className="max-w-[500px] mx-auto bg-white dark:bg-[#1e1e20] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 min-h-[400px] space-y-3">
          {fields.length === 0 && <div className="text-center text-gray-400 dark:text-gray-500 mt-20 text-sm">拖拽或点击左侧添加表单项</div>}
          {fields.map((f) => (
            <div key={f.id} onClick={(e) => { e.stopPropagation(); setSelectedId(f.id); }} className={`p-3 rounded border-2 cursor-pointer relative group ${selectedId === f.id ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-900/20' : 'border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}>
              <div className="text-[12px] font-medium text-gray-700 dark:text-gray-200 mb-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 flex items-center justify-between">
                <span>{f.type} 控件</span>
                {f.type === 'select' && <ChevronRight size={14} className="rotate-90" />}
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="absolute right-2 top-2 p-1 text-red-500 opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="w-[280px] border-l border-gray-200/60 dark:border-gray-800 bg-white dark:bg-[#1a1a1c] p-4 transition-colors">
        <div className="text-[12px] font-bold text-gray-700 dark:text-gray-200 mb-4">控件属性</div>
        {selField ? (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-1">字段名称</label>
              <input type="text" value={selField.label} onChange={(e) => updateField(selField.id, { label: e.target.value })} className="w-full text-[12px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded p-1.5 outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-1">字段 ID (Key)</label>
              <input type="text" value={selField.id} disabled className="w-full text-[12px] border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-1.5 text-gray-400 dark:text-gray-600 font-mono" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-gray-700 dark:text-gray-300">必填项</label>
              <input type="checkbox" checked={selField.required} onChange={(e) => updateField(selField.id, { required: e.target.checked })} />
            </div>
            {selField.type === 'select' && (
              <div>
                <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-1">选项配置 (逗号分隔)</label>
                <textarea value={(selField.options || []).join(',')} onChange={(e) => updateField(selField.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="w-full text-[12px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded p-1.5 outline-none focus:border-blue-400 min-h-[60px]" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-600 text-xs mt-10">选中控件以编辑属性</div>
        )}
      </div>
    </div>
  );
}

function WorkflowCanvas({
  nodes,
  setNodes,
  edges,
  setEdges,
}: {
  nodes: FlowNode[];
  setNodes: Dispatch<SetStateAction<FlowNode[]>>;
  edges: FlowEdge[];
  setEdges: Dispatch<SetStateAction<FlowEdge[]>>;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const showToast = useToast();
  const dragStartRef = useRef<{ nodeId: string; startClientX: number; startClientY: number; offsetX: number; offsetY: number } | null>(null);
  const hasMovedRef = useRef(false);

  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [nodeTypeOptions, setNodeTypeOptions] = useState<NodeTypeOption[]>([]);
  const [approvers, setApprovers] = useState<{ label: string; value: string }[]>([]);

  const addNodeAtClientPosition = (type: string, name: string, clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const internalX = (clientX - rect.left) / zoom - 70;
    const internalY = (clientY - rect.top) / zoom - 20;
    const newNode: FlowNode = { id: `${type}_${Date.now()}`, type, name, x: internalX, y: internalY };
    setNodes((prevNodes) => [...prevNodes, newNode]);
    setSelectedNode(newNode.id);
    setSelectedEdge(null);
  };

  const handleDragStart = (e: DragEvent, type: string, name: string) => {
    e.dataTransfer.setData('node_type', type);
    e.dataTransfer.setData('node_name', name);
  };
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('node_type');
    const name = e.dataTransfer.getData('node_name');
    if (!type) return;
    addNodeAtClientPosition(type, name, e.clientX, e.clientY);
  };
  const handleNodeTypeClick = (type: string, name: string) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const offset = Math.min(nodes.length, 10) * 18;
    addNodeAtClientPosition(type, name, rect.left + rect.width / 2 + offset, rect.top + rect.height / 2 + offset);
  };

  const handleNodeMouseDown = (e: MouseEvent, id: string, x: number, y: number) => {
    if (connectingFrom) return;
    e.stopPropagation();
    setSelectedNode(id);
    setSelectedEdge(null);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStartRef.current = {
      nodeId: id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      offsetX: (e.clientX - rect.left) / zoom - x,
      offsetY: (e.clientY - rect.top) / zoom - y,
    };
    hasMovedRef.current = false;
  };

  const handlePortMouseDown = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedNode(id);
    setSelectedEdge(null);
    setConnectingFrom(id);
    dragStartRef.current = null;
    setDraggingNode(null);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) setMousePos({ x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if ((e.buttons & 1) === 0) {
      if (dragStartRef.current) {
        setDraggingNode(null);
        dragStartRef.current = null;
        hasMovedRef.current = false;
      }
      if (connectingFrom) setConnectingFrom(null);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentX = (e.clientX - rect.left) / zoom;
    const currentY = (e.clientY - rect.top) / zoom;

    if (connectingFrom) {
      setMousePos({ x: currentX, y: currentY });
      return;
    }

    const dragStart = dragStartRef.current;
    if (!dragStart) return;

    const movement = Math.hypot(e.clientX - dragStart.startClientX, e.clientY - dragStart.startClientY);
    if (movement < 4 && !draggingNode) return;

    if (!draggingNode) setDraggingNode(dragStart.nodeId);
    hasMovedRef.current = true;
    setNodes((prevNodes) => prevNodes.map((n: FlowNode) => (n.id === dragStart.nodeId ? { ...n, x: currentX - dragStart.offsetX, y: currentY - dragStart.offsetY } : n)));
  };

  const handleNodeMouseUp = (e: MouseEvent, targetId: string) => {
    e.stopPropagation();
    const wasMoved = hasMovedRef.current;
    const targetNode = nodes.find((n) => n.id === targetId);
    if (connectingFrom && connectingFrom !== targetId && targetNode?.type !== 'start') {
      setEdges((prevEdges) => {
        const duplicated = prevEdges.find((edge: FlowEdge) => edge.source === connectingFrom && edge.target === targetId);
        if (duplicated) return prevEdges;
        return [...prevEdges, { id: `edge_${Date.now()}`, source: connectingFrom, target: targetId, condition: '', is_default: false }];
      });
    } else if (!wasMoved) {
      setSelectedNode(targetId);
      setSelectedEdge(null);
    }
    setConnectingFrom(null);
    setDraggingNode(null);
    dragStartRef.current = null;
    hasMovedRef.current = false;
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
    if (connectingFrom) setConnectingFrom(null);
  };

  const handleNodeClick = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedNode(id);
    setSelectedEdge(null);
  };

  useEffect(() => {
    request('GET', '/enum/node-types')
      .then((res) => setNodeTypeOptions(Array.isArray(res.list) ? res.list : []))
      .catch((err) => showToast(err.message || '节点类型加载失败', 'error'));

    // 加载所有审批人员
    request('GET', '/enum/approvers?limit=100')
      .then((res) => setApprovers(Array.isArray(res.list) ? res.list : []))
      .catch((err) => showToast(err.message || '审批人员加载失败', 'error'));
  }, [showToast]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggingNode(null);
      dragStartRef.current = null;
      hasMovedRef.current = false;
      setConnectingFrom(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedNode) {
          setNodes(nodes.filter((n: FlowNode) => n.id !== selectedNode));
          setEdges(edges.filter((edge: FlowEdge) => edge.source !== selectedNode && edge.target !== selectedNode));
          setSelectedNode(null);
        } else if (selectedEdge) {
          setEdges(edges.filter((edge: FlowEdge) => edge.id !== selectedEdge));
          setSelectedEdge(null);
        }
      } else if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedEdge(null);
        setConnectingFrom(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, nodes, edges, setNodes, setEdges]);

  const getNodeColor = (type: string) => {
    if (type === 'start') return 'bg-green-500';
    if (type === 'end') return 'bg-gray-500';
    if (type === 'user_task') return 'bg-blue-600';
    if (type.includes('gateway')) return 'bg-orange-500';
    if (type === 'email_service') return 'bg-indigo-500';
    return 'bg-gray-400';
  };

  const nodeTypeMeta: Record<string, { icon: ReactNode; color: 'blue' | 'orange' | 'purple' | 'green' | 'gray' | 'indigo'; defaultName: string; group: 'basic' | 'gateway' | 'plugin' }> = {
    start: { icon: <Circle size={14} />, color: 'green', defaultName: '开始', group: 'basic' },
    end: { icon: <StopCircle size={14} />, color: 'gray', defaultName: '结束', group: 'basic' },
    user_task: { icon: <User size={14} />, color: 'blue', defaultName: '审批节点', group: 'basic' },
    xor_gateway: { icon: <GitBranch size={14} />, color: 'orange', defaultName: '排他网关', group: 'gateway' },
    fork_gateway: { icon: <GitBranch size={14} />, color: 'purple', defaultName: '并行网关', group: 'gateway' },
    join_gateway: { icon: <GitBranch size={14} />, color: 'purple', defaultName: '汇聚网关', group: 'gateway' },
    inclusive_gateway: { icon: <GitBranch size={14} />, color: 'orange', defaultName: '包含网关', group: 'gateway' },
    email_service: { icon: <Mail size={14} />, color: 'indigo', defaultName: '发邮件', group: 'plugin' },
  };

  const fallbackNodeTypes: NodeTypeOption[] = [
    { label: '开始节点', value: 'start' },
    { label: '结束节点', value: 'end' },
    { label: '用户任务', value: 'user_task' },
    { label: '排他网关', value: 'xor_gateway' },
    { label: '并行分支网关', value: 'fork_gateway' },
    { label: '并行汇聚网关', value: 'join_gateway' },
    { label: '包含网关', value: 'inclusive_gateway' },
  ];
  const effectiveNodeTypes = nodeTypeOptions.length > 0 ? nodeTypeOptions : fallbackNodeTypes;
  const basicNodeTypes = effectiveNodeTypes.filter((item) => nodeTypeMeta[item.value]?.group === 'basic');
  const gatewayNodeTypes = effectiveNodeTypes.filter((item) => nodeTypeMeta[item.value]?.group === 'gateway');
  const pluginNodeTypes = effectiveNodeTypes.filter((item) => nodeTypeMeta[item.value]?.group === 'plugin');

  const renderNodeTypeMenuItem = (item: NodeTypeOption) => {
    const meta = nodeTypeMeta[item.value];
    if (!meta) return null;
    return (
      <DraggableMenuItem
        key={item.value}
        icon={meta.icon}
        label={item.label}
        color={meta.color}
        onDragStart={(e: DragEvent) => handleDragStart(e, item.value, meta.defaultName)}
        onClick={() => handleNodeTypeClick(item.value, meta.defaultName)}
      />
    );
  };

  const getPortPos = (id: string, isSource: boolean) => {
    const n = nodes.find((node: FlowNode) => node.id === id);
    if (!n) return { x: 0, y: 0 };
    return { x: isSource ? n.x + 160 : n.x, y: n.y + 22 };
  };

  const createBezierPath = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = Math.max(Math.abs(p2.x - p1.x) * 0.5, 50);
    return `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      <div className="absolute top-6 left-6 z-40 flex flex-col space-y-3">
        <div className="relative group">
          <button className="flex items-center px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700 shadow-sm rounded-lg text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-all active:scale-95">
            <Component size={14} className="mr-2 text-blue-500" />
            流程节点
          </button>
          <div className="absolute top-0 left-full pl-2.5 opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-200 origin-left">
            <div className="w-52 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700 rounded-xl shadow-lg p-2">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">基础事件</div>
              {basicNodeTypes.map(renderNodeTypeMenuItem)}
              {pluginNodeTypes.length > 0 && (
                <>
                  <div className="my-1.5 border-t border-gray-100/80 dark:border-gray-700 mx-2"></div>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">自动插件</div>
                  {pluginNodeTypes.map(renderNodeTypeMenuItem)}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative group">
          <button className="flex items-center px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700 shadow-sm rounded-lg text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:text-orange-600 transition-all active:scale-95">
            <Workflow size={14} className="mr-2 text-orange-500" />
            逻辑网关
          </button>
          <div className="absolute top-0 left-full pl-2.5 opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-200 origin-left">
            <div className="w-52 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700 rounded-xl shadow-lg p-2">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">分支判定</div>
              {gatewayNodeTypes.map(renderNodeTypeMenuItem)}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-40 flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700 shadow-sm rounded-lg p-1 space-x-1">
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <ZoomOut size={14} />
        </button>
        <div className="px-2 text-[11px] font-medium text-gray-600 dark:text-gray-300 w-12 text-center select-none">{Math.round(zoom * 100)}%</div>
        <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          <ZoomIn size={14} />
        </button>
        <div className="w-px h-3 bg-gray-200/80 dark:bg-gray-700 mx-1"></div>
        <button onClick={() => setZoom(1)} className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="还原比例">
          <Maximize size={14} />
        </button>
      </div>

      <div
        ref={canvasRef}
        className="flex-1 relative bg-[radial-gradient(#e5e5ea_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] outline-none cursor-default overflow-hidden"
        style={{ backgroundSize: `${20 * zoom}px ${20 * zoom}px` }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onMouseMove={handleMouseMove}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: '100%', height: '100%' }} className="absolute top-0 left-0 transition-transform duration-100" onClick={handleCanvasClick}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-gray-400 dark:fill-gray-600" />
              </marker>
              <marker id="arrow-selected" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-blue-500" />
              </marker>
            </defs>
            {edges.map((edge: FlowEdge) => {
              const p1 = getPortPos(edge.source, true);
              const p2 = getPortPos(edge.target, false);
              const isSelected = selectedEdge === edge.id;
              return (
                <g key={edge.id} className="cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); setSelectedEdge(edge.id); setSelectedNode(null); }}>
                  <path d={createBezierPath(p1, p2)} stroke="transparent" strokeWidth="12" fill="none" />
                  <path d={createBezierPath(p1, p2)} fill="none" className={`${isSelected ? 'stroke-blue-500' : 'stroke-gray-400 dark:stroke-gray-600'} transition-colors`} strokeWidth="2" markerEnd={`url(#${isSelected ? 'arrow-selected' : 'arrow'})`} />
                </g>
              );
            })}
            {connectingFrom && <path d={createBezierPath(getPortPos(connectingFrom, true), mousePos)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" className="pointer-events-none" />}
          </svg>

          {nodes.map((node: FlowNode) => (
            <div
              key={node.id}
              style={{ left: node.x, top: node.y, width: 160, height: 44, zIndex: selectedNode === node.id ? 20 : 10 }}
              className={`absolute flex items-center bg-white dark:bg-gray-800 border-2 rounded-lg shadow-sm select-none transition-shadow ${draggingNode === node.id ? 'cursor-grabbing' : 'cursor-move'} ${selectedNode === node.id ? 'border-blue-500 shadow-md ring-2 ring-blue-100 dark:ring-blue-900/50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id, node.x, node.y)}
              onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.id)}
            >
              <div className={`w-2 h-full rounded-l-md ${getNodeColor(node.type)}`}></div>
              <div className="flex-1 px-3 text-[12px] font-medium text-gray-800 dark:text-gray-200 truncate">{node.name}</div>
              {node.type !== 'end' && (
                <div onMouseDown={(e) => handlePortMouseDown(e, node.id)} onClick={(e) => e.stopPropagation()} className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-full cursor-crosshair z-20 transition-opacity ${selectedNode === node.id ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`} title="按住拖拽连线"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {(selectedNode || selectedEdge) && (
        <div className="w-[280px] bg-white dark:bg-[#1a1a1c] border-l border-gray-200/60 dark:border-gray-800 z-20 flex flex-col transition-colors">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#18181a]">
            <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200">{selectedNode ? '节点属性' : '连线属性'}</span>
            <button onClick={() => { setSelectedNode(null); setSelectedEdge(null); }} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {selectedEdge &&
              (() => {
                const edge = edges.find((e: FlowEdge) => e.id === selectedEdge);
                if (!edge) return null;
                const sourceNode = nodes.find((n: FlowNode) => n.id === edge.source);
                return (
                  <>
                    <div className="text-[11px] text-gray-400 font-mono mb-2">ID: {edge.id}</div>
                    {sourceNode?.type === 'xor_gateway' ? (
                      <>
                        <div>
                          <label className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 block">分支条件表达式 (Condition)</label>
                          <input type="text" placeholder="例如: amount > 1000" value={edge.condition || ''} onChange={(e) => setEdges(edges.map((eg: FlowEdge) => (eg.id === edge.id ? { ...eg, condition: e.target.value } : eg)))} className="w-full text-xs p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border rounded border-gray-300 dark:border-gray-600 outline-none focus:border-blue-500 font-mono" />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-gray-700 dark:text-gray-300">设为默认分支 (Default)</label>
                          <input type="checkbox" checked={edge.is_default || false} onChange={(e) => setEdges(edges.map((eg: FlowEdge) => (eg.id === edge.id ? { ...eg, is_default: e.target.checked } : eg)))} />
                        </div>
                      </>
                    ) : (
                      <div className="text-[12px] text-gray-500">常规节点连线无需配置条件属性。</div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-4">选中按 Backspace 或 Delete 可删除连线。</p>
                  </>
                );
              })()}

            {selectedNode &&
              (() => {
                const node = nodes.find((n: FlowNode) => n.id === selectedNode);
                if (!node) return null;
                return (
                  <>
                    <div>
                      <label className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 block">节点名称</label>
                      <input type="text" value={node.name} onChange={(e) => setNodes(nodes.map((n: FlowNode) => (n.id === node.id ? { ...n, name: e.target.value } : n)))} className="w-full text-xs p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border rounded border-gray-300 dark:border-gray-600 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 block">节点 ID (底层 Key)</label>
                      <input type="text" value={node.id} disabled className="w-full text-xs p-2 border rounded bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 font-mono" />
                    </div>
                    {node.type === 'user_task' && (
                      <div>
                        <label className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 block">指定审批人</label>
                        <ApproverSelector
                          approvers={approvers}
                          selectedUids={node.candidates?.users || []}
                          onChange={(uids) => {
                            const newCandidates = { users: uids };
                            setNodes(nodes.map((n: FlowNode) => (n.id === node.id ? { ...n, candidates: newCandidates } : n)));
                          }}
                        />
                      </div>
                    )}
                  </>
                );
              })()}
          </div>
        </div>
      )}
    </div>
  );
}

function DraggableMenuItem({
  icon,
  label,
  color,
  onDragStart,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  color: 'blue' | 'orange' | 'purple' | 'green' | 'gray' | 'indigo';
  onDragStart: (e: DragEvent) => void;
  onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800',
    orange: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800',
    purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800',
    green: 'text-green-500 bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800',
    gray: 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700',
    indigo: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800',
  };
  return (
    <div draggable onDragStart={onDragStart} onClick={onClick} title="点击添加到画布中心，或拖拽到指定位置" className="flex items-center p-1.5 rounded-lg cursor-grab hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group/item active:scale-[0.98]">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center mr-2.5 border shadow-sm ${colorMap[color]}`}>{icon}</div>
      <div className="flex flex-col">
        <span className="text-[12px] font-medium text-gray-800 dark:text-gray-200 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">{label}</span>
      </div>
    </div>
  );
}
