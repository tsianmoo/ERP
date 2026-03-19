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

// 商品属性值相关 API
export const attributeValuesApi = {
  list: () => callJavaBackend<unknown>('/api/products/attribute-values'),

  getByAttribute: (attributeId: number) => callJavaBackend<unknown>(`/api/products/attribute-values/attribute/${attributeId}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/attribute-values', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/attribute-values/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/attribute-values/${id}`, { method: 'DELETE' }),
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

// 编码规则相关 API
export const codeRulesApi = {
  list: () => callJavaBackend<unknown>('/api/products/code-rules'),

  get: (id: number) => callJavaBackend<unknown>(`/api/products/code-rules/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/code-rules', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/code-rules/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/code-rules/${id}`, { method: 'DELETE' }),
};

// 颜色分组相关 API
export const colorGroupsApi = {
  list: () => callJavaBackend<unknown>('/api/products/color-groups'),

  get: (id: number) => callJavaBackend<unknown>(`/api/products/color-groups/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/color-groups', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/color-groups/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/color-groups/${id}`, { method: 'DELETE' }),

  reorder: (groupIds: number[]) => callJavaBackend<unknown>('/api/products/color-groups/reorder', { method: 'POST', body: { groupIds } }),
};

// 尺码分组相关 API
export const sizeGroupsApi = {
  list: () => callJavaBackend<unknown>('/api/products/size-groups'),

  get: (id: number) => callJavaBackend<unknown>(`/api/products/size-groups/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/size-groups', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/size-groups/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/size-groups/${id}`, { method: 'DELETE' }),

  reorder: (groupIds: number[]) => callJavaBackend<unknown>('/api/products/size-groups/reorder', { method: 'POST', body: { groupIds } }),
};

// 供应商相关 API
export const suppliersApi = {
  list: () => callJavaBackend<unknown>('/api/suppliers'),

  get: (id: number) => callJavaBackend<unknown>(`/api/suppliers/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/suppliers', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/suppliers/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/suppliers/${id}`, { method: 'DELETE' }),
};

// 图片相关 API
export const imagesApi = {
  list: () => callJavaBackend<unknown>('/api/images'),

  getByCategory: (categoryId: number) => callJavaBackend<unknown>(`/api/images/category/${categoryId}`),

  get: (id: number) => callJavaBackend<unknown>(`/api/images/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/images', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/images/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/images/${id}`, { method: 'DELETE' }),
};
