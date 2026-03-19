/**
 * Java 后端 API 客户端
 * 用于在 Next.js API Routes 中调用 Java Spring Boot 后端服务
 */

const JAVA_BACKEND_URL = process.env.JAVA_BACKEND_URL || 'http://localhost:8080';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function callJavaBackend<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { method = 'GET', body, headers = {} } = options;

  try {
    const response = await fetch(`${JAVA_BACKEND_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: data.error || `HTTP Error: ${response.status}`,
        status: response.status,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    console.error('Java Backend API Error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
    };
  }
}

// 商品相关 API
export const productsApi = {
  list: (page = 1, pageSize = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.append('status', status);
    return callJavaBackend<unknown>(`/api/products?${params}`);
  },

  get: (id: number) => callJavaBackend<unknown>(`/api/products/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/${id}`, { method: 'DELETE' }),
};

// 商品属性相关 API
export const attributesApi = {
  list: () => callJavaBackend<unknown>('/api/products/attributes'),

  get: (id: number) => callJavaBackend<unknown>(`/api/products/attributes/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/attributes', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/attributes/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/attributes/${id}`, { method: 'DELETE' }),
};

// 商品属性分组相关 API
export const attributeGroupsApi = {
  list: () => callJavaBackend<unknown>('/api/products/attribute-groups'),

  get: (id: number) => callJavaBackend<unknown>(`/api/products/attribute-groups/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/attribute-groups', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/attribute-groups/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/attribute-groups/${id}`, { method: 'DELETE' }),
};

// 商品基本字段相关 API
export const basicFieldsApi = {
  list: () => callJavaBackend<unknown>('/api/products/basic-fields'),

  get: (id: number) => callJavaBackend<unknown>(`/api/products/basic-fields/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/basic-fields', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/basic-fields/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/basic-fields/${id}`, { method: 'DELETE' }),
};
