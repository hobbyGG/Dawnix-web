export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  value?: any;
}

export interface FlowNode {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  candidates?: { users?: string[] };
  properties?: any;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
  is_default?: boolean;
}

export interface Definition {
  ID?: number;
  id?: number;
  Code?: string;
  code?: string;
  Version?: number;
  version?: number;
  Name?: string;
  name?: string;
  Structure?: { nodes: FlowNode[]; edges: FlowEdge[]; viewport?: any };
  structure?: any;
  FormDefinition?: FormField[];
  form_definition?: FormField[];
  IsActive?: boolean;
  is_active?: boolean;
  UpdatedAt?: string;
  updated_at?: string;
}

export interface FormDataItem {
  id: string;
  label: string;
  type: string;
  value: any;
}

export interface TimelineRecord {
  id: string;
  node_name: string;
  operator: string;
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'PENDING';
  comment?: string;
  time: string;
}

export interface Task {
  ID?: number;
  id?: number;
  TaskName?: string;
  task_name?: string;
  Status?:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'TRANSFERRED'
    | 'ROLLED_BACK'
    | 'CANCELED'
    | 'ABORTED';
  status?: string;
  ProcessTitle?: string;
  process_title?: string;
  SubmitterName?: string;
  submitter_name?: string;
  ArrivedAt?: string;
  arrived_at?: string;
  form_data?: FormDataItem[];
  FormData?: FormDataItem[];
  timeline?: TimelineRecord[];
  Timeline?: TimelineRecord[];
}

export interface Instance {
  ID?: number;
  id?: number;
  ProcessCode?: string;
  process_code?: string;
  ProcessName?: string;
  process_name?: string;
  Status?: string;
  status?: string;
  SubmitterID?: string;
  submitter_id?: string;
  CreatedAt?: string;
  created_at?: string;
  form_data?: FormDataItem[];
  FormData?: FormDataItem[];
  timeline?: TimelineRecord[];
  Timeline?: TimelineRecord[];
}

export interface UserInfo {
  user_id?: string;
  username?: string;
  display_name?: string;
}

export interface InstanceExecution {
  ID?: number;
  id?: number;
  NodeID?: string;
  node_id?: string;
  IsActive?: boolean;
  is_active?: boolean;
  CreatedAt?: string;
  created_at?: string;
  UpdatedAt?: string;
  updated_at?: string;
}

export interface InstanceDetailResponse {
  inst?: Instance;
  executions?: InstanceExecution[];
}

export interface NodeTypeOption {
  label: string;
  value: string;
}
