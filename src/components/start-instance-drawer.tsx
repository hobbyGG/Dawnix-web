import { Loader2, Play, Send, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { request } from '../lib/api';
import { useNavigate } from '../router/hash-router';
import type { Definition, FormDataItem } from '../types/workflow';
import { useToast } from './toast';

interface StartInstanceDrawerProps {
  def: Definition;
  onClose: () => void;
}

export function StartInstanceDrawer({ def, onClose }: StartInstanceDrawerProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  const formDef = def.FormDefinition || def.form_definition || [];
  const processCode = def.Code || def.code || '';
  const processName = def.Name || def.name || '';
  const processVersion = def.Version || def.version || 1;

  useEffect(() => {
    const initData: Record<string, string> = {};
    formDef.forEach((f) => {
      if (f.type === 'select' && f.options && f.options.length > 0) {
        initData[f.id] = f.options[0];
      }
    });
    setFormData(initData);
  }, [formDef]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const submitData: FormDataItem[] = formDef.map((field) => {
      let val = formData[field.id];
      if (val === undefined) val = '';
      return { id: field.id, label: field.label, type: field.type, value: val };
    });

    try {
      await request('POST', '/instance/create', { process_code: processCode, form_data: submitData });
      showToast('流程发起成功！', 'success');
      onClose();
      navigate('/instances');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/20 dark:bg-black/40 backdrop-blur-[2px] z-50 transition-opacity" onClick={onClose}></div>
      <div className="fixed top-0 right-0 w-[440px] h-full bg-white dark:bg-[#1a1a1c] border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col fade-in">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 flex justify-between items-start">
          <div>
            <div className="text-[11px] text-blue-500 font-semibold uppercase tracking-wider mb-1 flex items-center">
              <Play size={12} className="mr-1" /> 发起新流程
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">{processName}</h2>
            <p className="text-[11px] text-gray-400 font-mono mt-1">
              {processCode} • v{processVersion}.0
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors active:scale-90">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#fbfbfd] dark:bg-[#121212]">
          <form id="start-process-form" onSubmit={handleSubmit} className="space-y-5">
            {formDef.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">该流程无需填写表单，可直接发起。</div>}
            {formDef.map((field) => (
              <div key={field.id}>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 text-[13px] outline-none focus:border-blue-500 min-h-[80px]"
                  />
                ) : field.type === 'number' ? (
                  <input
                    type="number"
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 text-[13px] outline-none focus:border-blue-500"
                  />
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 text-[13px] outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>
                      请选择...
                    </option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required={field.required}
                    placeholder={field.placeholder || `请输入${field.label}`}
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 text-[13px] outline-none focus:border-blue-500"
                  />
                )}
              </div>
            ))}
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a1a1c] flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-[13px] font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm"
          >
            取消
          </button>
          <button
            type="submit"
            form="start-process-form"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white text-[13px] font-medium rounded-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center shadow-sm disabled:opacity-70"
          >
            {submitting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Send size={14} className="mr-1.5" />} 提交发起
          </button>
        </div>
      </div>
    </>
  );
}
