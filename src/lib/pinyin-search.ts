import { pinyin, segment } from 'pinyin-pro';

export interface SearchableApprover {
  label: string;
  value: string;
  pinyinFull: string;
  pinyinInitials: string;
}

/**
 * 将人员列表转换为可搜索的格式，预计算拼音
 */
export function prepareApproversForSearch(approvers: { label: string; value: string }[]): SearchableApprover[] {
  return approvers.map((approver) => {
    const pinyinFull = pinyin(approver.label, { toneType: 'none' });
    
    // 获取首字母：按字符处理，获取第一个拼音的首字母
    let pinyinInitials = '';
    for (const char of approver.label) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 是中文字符
        const py = pinyin(char, { toneType: 'none' });
        pinyinInitials += py.charAt(0).toLowerCase();
      } else {
        // 英文或其他字符
        pinyinInitials += char.toLowerCase();
      }
    }

    return {
      ...approver,
      pinyinFull: pinyinFull.toLowerCase(),
      pinyinInitials,
    };
  });
}

/**
 * 模糊搜索逻辑
 * 支持: 中文名称、拼音首字母、完整拼音
 */
export function filterApprovers(keyword: string, approvers: SearchableApprover[]): SearchableApprover[] {
  if (!keyword.trim()) return approvers;

  const lowerKeyword = keyword.toLowerCase().trim();

  return approvers.filter((approver) => {
    // 1. 中文名称模糊匹配（任意位置包含）
    if (approver.label.includes(keyword)) return true;

    // 2. 拼音首字母匹配
    if (approver.pinyinInitials.includes(lowerKeyword)) return true;

    // 3. 完整拼音匹配
    if (approver.pinyinFull.includes(lowerKeyword)) return true;

    // 4. 用户ID匹配
    if (approver.value.includes(keyword)) return true;

    return false;
  });
}

/**
 * 对搜索结果排序：优先显示名称包含关键词的人员
 */
export function sortApprovers(keyword: string, approvers: SearchableApprover[]): SearchableApprover[] {
  if (!keyword.trim()) return approvers;

  const lowerKeyword = keyword.toLowerCase().trim();

  return [...approvers].sort((a, b) => {
    const aNameMatch = a.label.toLowerCase().startsWith(lowerKeyword);
    const bNameMatch = b.label.toLowerCase().startsWith(lowerKeyword);

    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;

    const aPinyinMatch = a.pinyinInitials.startsWith(lowerKeyword);
    const bPinyinMatch = b.pinyinInitials.startsWith(lowerKeyword);

    if (aPinyinMatch && !bPinyinMatch) return -1;
    if (!aPinyinMatch && bPinyinMatch) return 1;

    return 0;
  });
}
