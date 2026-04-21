# ApproverSelector 组件使用指南

## 快速开始

### 基础用法

```tsx
import ApproverSelector from '@/components/approver-selector';

function MyComponent() {
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const approvers = [
    { label: '张三', value: 'uid_001' },
    { label: '李四', value: 'uid_002' },
    { label: '王五', value: 'uid_003' },
  ];

  return (
    <ApproverSelector
      approvers={approvers}
      selectedUids={selectedUids}
      onChange={setSelectedUids}
    />
  );
}
```

## 完整 Props 参考

```typescript
interface ApproverSelectorProps {
  // 必填：可选人员列表
  approvers: Array<{ label: string; value: string }>;
  
  // 必填：已选中的 UID 数组
  selectedUids: string[];
  
  // 必填：选择变更回调
  onChange: (uids: string[]) => void;
  
  // 可选：占位符文本，默认 '搜索并选择审批人...'
  placeholder?: string;
}
```

## 功能特性

### 1. 多选功能
- 支持同时选择多个人员
- 已选人员显示为蓝色 Tag
- 点击 Tag 上的 × 可移除单个人员

```tsx
// selectedUids 为数组
selectedUids={['uid_001', 'uid_002']}
onChange={setSelectedUids}
```

### 2. 搜索过滤
支持 4 种搜索模式：

#### 中文名称搜索
```
输入：张
结果：匹配所有包含 "张" 的人员
```

#### 拼音首字母搜索
```
输入：z 或 zs
结果：匹配 "张三"、"赵六" 等
```

#### 完整拼音搜索
```
输入：zhang
结果：匹配所有包含拼音 "zhang" 的人员
```

#### UID 搜索
```
输入：uid_001
结果：直接匹配该 UID 的人员
```

### 3. 快速操作

#### 全选
点击下拉菜单中的 "全选" 按钮，一键选中所有人员

```tsx
// 之后 selectedUids 将包含所有 uid
selectedUids={approvers.map(a => a.value)}
```

#### 清空
点击下拉菜单中的 "清空" 按钮，一键清除所有选择

```tsx
// 之后 selectedUids 变为空数组
selectedUids=[]
```

### 4. UI 交互

| 动作 | 结果 |
|------|------|
| 点击输入框 | 打开下拉菜单 |
| 输入文本 | 实时过滤搜索 |
| 点击人员项 | 切换选中状态 |
| 点击 Tag × | 移除单个人员 |
| 点击外部 | 自动关闭菜单 |
| Escape 键 | 关闭菜单 |

## 集成示例

### 与流程定义编辑器集成

```tsx
// 在 WorkflowCanvas 中使用
const [approvers, setApprovers] = useState<{ label: string; value: string }[]>([]);

// 组件挂载时加载人员列表
useEffect(() => {
  request('GET', '/enum/approvers?limit=100')
    .then((res) => setApprovers(Array.isArray(res.list) ? res.list : []))
    .catch((err) => showToast(err.message, 'error'));
}, []);

// 在节点属性面板中使用
{node.type === 'user_task' && (
  <ApproverSelector
    approvers={approvers}
    selectedUids={node.candidates?.users || []}
    onChange={(uids) => {
      const newCandidates = { users: uids };
      setNodes(nodes.map((n) =>
        n.id === node.id ? { ...n, candidates: newCandidates } : n
      ));
    }}
  />
)}
```

## 数据提交

### 保存到后端

选中的审批人最终以数组形式保存到 `node.candidates.users` 中：

```json
{
  "nodes": [
    {
      "id": "user_task_123",
      "type": "user_task",
      "name": "经理审批",
      "candidates": {
        "users": [
          "uid_1980531045852420096",
          "uid_1980531045852420097",
          "uid_1980531045852420098"
        ]
      }
    }
  ]
}
```

### 从后端加载

从后端返回的已保存流程中，提取 `candidates.users` 数组作为初始值：

```tsx
// 编辑已有流程时
<ApproverSelector
  approvers={approvers}
  selectedUids={existingNode.candidates?.users || []}
  onChange={handleChange}
/>
```

## 样式定制

### CSS Classes

组件使用 Tailwind CSS，支持深色模式。主要 class：

```tsx
// 输入框容器
"min-h-10 p-2 bg-white dark:bg-gray-800 border rounded"

// 已选 Tag
"bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"

// 下拉菜单
"bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"

// 人员项（已选）
"bg-blue-50 dark:bg-blue-900/30"
```

### 深色模式

组件已完全兼容深色模式，自动响应系统设置。

## 性能优化

### 预计算拼音

组件内部预计算所有人员的拼音信息，避免重复转换：

```tsx
// 内部自动执行
const searchableApprovers = prepareApproversForSearch(approvers);
// → 每个人员新增: pinyinFull, pinyinInitials 字段
```

### 搜索结果排序

搜索结果按相关性排序，提高用户体验：

```
优先级：
1. 中文名称前缀匹配
2. 拼音首字母前缀匹配
3. 其他匹配
```

## 常见问题

### Q1: 如何限制最多可选人数？

在 `onChange` 回调中添加检查：

```tsx
onChange={(uids) => {
  if (uids.length <= 3) {
    setSelectedUids(uids);
  } else {
    showToast('最多只能选择3个人', 'warning');
  }
}}
```

### Q2: 如何禁用某些人员？

可以在使用组件前过滤人员列表：

```tsx
const availableApprovers = approvers.filter(a => !disabledUids.includes(a.value));
<ApproverSelector approvers={availableApprovers} ... />
```

### Q3: 搜索结果为空时显示提示？

已内置，当 `keyword` 不为空但无结果时，显示 "没有匹配的人员"。

### Q4: 如何清空搜索词但保留选择？

清空输入框即可，选中的 Tag 不会改变：

```tsx
// 点击某处清空输入框
setKeyword('');
// selectedUids 保持不变
```

### Q5: 如何实现远程搜索？

当前组件仅在本地过滤。如需远程搜索，需修改 `approvers` 的加载方式：

```tsx
const [keyword, setKeyword] = useState('');

useEffect(() => {
  if (keyword) {
    // 远程搜索
    request('GET', `/enum/approvers?keyword=${keyword}&limit=100`)
      .then(res => setApprovers(res.list))
      .catch(err => showToast(err.message, 'error'));
  } else {
    // 加载全部
    request('GET', '/enum/approvers?limit=100')
      .then(res => setApprovers(res.list));
  }
}, [keyword]);
```

## 故障排查

### 人员列表为空

检查：
1. 后端 `/enum/approvers` 是否返回数据
2. 浏览器控制台是否有 API 错误
3. 网络请求是否成功

### 搜索不工作

检查：
1. 输入框是否获得焦点
2. 输入法是否在正确模式
3. 是否有 JS 错误（检查 Console）

### 样式异常

检查：
1. Tailwind CSS 是否正确加载
2. 深色模式 CSS 变量是否定义
3. 浏览器 DevTools 样式面板

## 相关文件

- **组件**: `src/components/approver-selector.tsx`
- **工具**: `src/lib/pinyin-search.ts`
- **测试指南**: 见项目文档

## API 接口

### 后端接口要求

```
GET /api/v1/enum/approvers?keyword=&limit=100

返回格式：
{
  "list": [
    {
      "label": "张三",
      "value": "1980531045852420096"
    },
    ...
  ]
}
```

参数：
- `keyword` (可选): 搜索关键词，按 display_name 或 user_id 过滤
- `limit` (可选): 返回条数限制，默认 20，最大 100

## 许可证

同项目许可证

---

**最后更新**: 2026-04-21
**版本**: 1.0.0
