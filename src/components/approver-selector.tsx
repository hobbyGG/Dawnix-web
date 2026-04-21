import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { filterApprovers, prepareApproversForSearch, sortApprovers, type SearchableApprover } from '../lib/pinyin-search';

interface ApproverSelectorProps {
  approvers: { label: string; value: string }[];
  selectedUids: string[];
  onChange: (uids: string[]) => void;
  placeholder?: string;
}

export default function ApproverSelector({ approvers, selectedUids, onChange, placeholder = '搜索并选择审批人...' }: ApproverSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchableApprovers, setSearchableApprovers] = useState<SearchableApprover[]>([]);
  const [filteredApprovers, setFilteredApprovers] = useState<SearchableApprover[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化：预计算所有人员的拼音信息
  useEffect(() => {
    const prepared = prepareApproversForSearch(approvers);
    setSearchableApprovers(prepared);
    setFilteredApprovers(prepared);
  }, [approvers]);

  // 搜索逻辑
  useEffect(() => {
    let results = filterApprovers(keyword, searchableApprovers);
    results = sortApprovers(keyword, results);
    setFilteredApprovers(results);
  }, [keyword, searchableApprovers]);

  // 外部点击关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const selectedApprovers = searchableApprovers.filter((a) => selectedUids.includes(a.value));

  const handleToggleApprover = (value: string) => {
    if (selectedUids.includes(value)) {
      onChange(selectedUids.filter((uid) => uid !== value));
    } else {
      onChange([...selectedUids, value]);
    }
  };

  const handleSelectAll = () => {
    const allUids = searchableApprovers.map((a) => a.value);
    onChange(allUids);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleRemoveTag = (uid: string) => {
    onChange(selectedUids.filter((id) => id !== uid));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 已选标签 + 输入框 */}
      <div className="w-full min-h-10 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded flex flex-wrap items-center gap-1.5 cursor-text" onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}>
        {selectedApprovers.map((approver) => (
          <div key={approver.value} className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs px-2 py-1 rounded">
            <span>{approver.label}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(approver.value);
              }}
              className="hover:text-blue-900 dark:hover:text-blue-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedApprovers.length === 0 ? placeholder : '继续搜索...'}
          className="flex-1 min-w-20 outline-none bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* 操作按钮 */}
          {searchableApprovers.length > 0 && (
            <div className="sticky top-0 flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={handleSelectAll}
                className="flex-1 text-xs px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                全选
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 text-xs px-2 py-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded transition-colors"
              >
                清空
              </button>
            </div>
          )}

          {/* 人员列表 */}
          {filteredApprovers.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">
              {keyword ? '没有匹配的人员' : '暂无人员'}
            </div>
          ) : (
            <div className="py-1">
              {filteredApprovers.map((approver) => {
                const isSelected = selectedUids.includes(approver.value);
                return (
                  <div
                    key={approver.value}
                    onClick={() => handleToggleApprover(approver.value)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="font-medium">{approver.label}</div>
                      <div className="text-gray-400 dark:text-gray-500 text-[10px] font-mono">{approver.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
