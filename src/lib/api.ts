const API_BASE = 'http://localhost:8080/api/v1';

interface ApiErrorPayload {
  error?: string;
  message?: string;
  msg?: string;
  code?: string | number;
}

const STATUS_ERROR_MESSAGES: Record<number, string> = {
  400: '请求参数有误，请检查后重试',
  401: '未登录或登录已过期，请重新登录',
  402: '未授权访问，请先登录',
  403: '没有权限执行该操作',
  404: '请求的资源不存在',
  409: '数据冲突，请刷新后重试',
  422: '提交的数据不符合要求',
  429: '请求过于频繁，请稍后再试',
  500: '服务器开小差了，请稍后重试',
  502: '网关异常，请稍后重试',
  503: '服务暂时不可用，请稍后重试',
  504: '服务响应超时，请稍后重试',
};

function resolveApiErrorMessage(status: number, payload: ApiErrorPayload): string {
  // 最优先：返回后端具体错误信息
  const backendError = payload.error || payload.message || payload.msg;
  if (backendError) {
    return backendError;
  }

  // 402/403 返回固定说明
  if (status === 402 || status === 403) {
    return STATUS_ERROR_MESSAGES[status];
  }

  // 其他情况用状态码映射
  const statusMessage = STATUS_ERROR_MESSAGES[status];
  if (statusMessage) {
    return statusMessage;
  }

  // 都没有则返回通用错误
  if (status >= 500) {
    return '服务器开小差了，请稍后重试';
  }

  return `请求失败（错误码 ${status}）`;
}

export async function request(method: string, path: string, data: any = null) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('dawnix_access_token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };

  if (token) headers.Authorization = `Bearer ${token}`;

  const options: RequestInit = { method, headers };
  if (data) options.body = JSON.stringify(data);

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      // 只在非登录/注册请求时触发 auth_error 事件
      // 登录请求返回401是正常的错误情况（如密码错误），不应该触发全局认证错误
      const isAuthRequest = path === '/auth/signin' || path === '/auth/signup';
      if ((res.status === 401 || res.status === 402) && !isAuthRequest) {
        localStorage.removeItem('dawnix_access_token');
        localStorage.removeItem('dawnix_user_info');
        window.dispatchEvent(new Event('auth_error'));
      }

      let errData: ApiErrorPayload = {};
      try {
        errData = await res.json();
      } catch (_) {
        // Fallback for non-JSON errors
      }

      throw new Error(resolveApiErrorMessage(res.status, errData));
    }
    return await res.json();
  } catch (error: any) {
    if (error instanceof TypeError) {
      error = new Error('网络异常，请检查后端服务或网络连接');
    }
    console.error(`[API Error] ${method} ${path}:`, error.message);
    throw error;
  }
}
