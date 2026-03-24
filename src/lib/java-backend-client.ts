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
      cache: 'no-store', // 禁用缓存，确保数据实时性
    });

    // 处理 204 No Content 响应
    if (response.status === 204) {
      return {
        data: null,
        error: null,
        status: 204,
      };
    }

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

  // 商品草稿
  getDraft: () => callJavaBackend<unknown>('/api/products/draft'),
  
  saveDraft: (data: unknown) => callJavaBackend<unknown>('/api/products/draft', { method: 'POST', body: data }),
  
  clearDraft: () => callJavaBackend<unknown>('/api/products/draft', { method: 'DELETE' }),

  // 批量更新
  batchUpdate: (data: unknown) => callJavaBackend<unknown>('/api/products/batch-update', { method: 'POST', body: data }),

  // 生成SKU
  generateSku: (data: unknown) => callJavaBackend<unknown>('/api/products/generate-sku', { method: 'POST', body: data }),

  // 生成条码
  generateBarcode: (data: unknown) => callJavaBackend<unknown>('/api/products/barcodes/generate', { method: 'POST', body: data }),

  // 生成编码
  generateCode: (data: unknown) => callJavaBackend<unknown>('/api/products/codes/generate', { method: 'POST', body: data }),

  // 生成字段值
  generateFieldValue: (data: unknown) => callJavaBackend<unknown>('/api/products/generate-field-value', { method: 'POST', body: data }),
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

// 商品字段分组相关 API
export const fieldGroupsApi = {
  list: () => callJavaBackend<unknown>('/api/products/field-groups'),

  get: (id: number) => callJavaBackend<unknown>(`/api/products/field-groups/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/field-groups', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/field-groups/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/field-groups/${id}`, { method: 'DELETE' }),
};

// 编码规则相关 API
export const codeRulesApi = {
  list: () => callJavaBackend<unknown>('/api/products/code-rules'),

  get: (id: number) => callJavaBackend<unknown>(`/api/products/code-rules/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/code-rules', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/code-rules/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/code-rules/${id}`, { method: 'DELETE' }),

  // 获取变量列表
  getVariables: () => callJavaBackend<unknown>('/api/products/code-rules/variables'),
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

// 颜色值相关 API
export const colorValuesApi = {
  list: () => callJavaBackend<unknown>('/api/products/color-values'),

  getByGroup: (groupId: number) => callJavaBackend<unknown>(`/api/products/color-values/group/${groupId}`),

  get: (id: number) => callJavaBackend<unknown>(`/api/products/color-values/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/color-values', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/color-values/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/color-values/${id}`, { method: 'DELETE' }),
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

// 尺码值相关 API
export const sizeValuesApi = {
  list: () => callJavaBackend<unknown>('/api/products/size-values'),

  getByGroup: (groupId: number) => callJavaBackend<unknown>(`/api/products/size-values/group/${groupId}`),

  get: (id: number) => callJavaBackend<unknown>(`/api/products/size-values/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/products/size-values', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/products/size-values/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/products/size-values/${id}`, { method: 'DELETE' }),
};

// 供应商相关 API
export const suppliersApi = {
  list: () => callJavaBackend<unknown>('/api/suppliers'),

  get: (id: number) => callJavaBackend<unknown>(`/api/suppliers/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/suppliers', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/suppliers/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/suppliers/${id}`, { method: 'DELETE' }),
};

// 供应商基本字段相关 API
export const supplierBasicFieldsApi = {
  list: () => callJavaBackend<unknown>('/api/suppliers/basic-fields'),

  getEnabled: () => callJavaBackend<unknown>('/api/suppliers/basic-fields/enabled'),

  get: (id: number) => callJavaBackend<unknown>(`/api/suppliers/basic-fields/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/suppliers/basic-fields', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/suppliers/basic-fields/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/suppliers/basic-fields/${id}`, { method: 'DELETE' }),
};

// 供应商字段分组相关 API
export const supplierFieldGroupsApi = {
  list: () => callJavaBackend<unknown>('/api/supplier-field-groups'),

  get: (id: number) => callJavaBackend<unknown>(`/api/supplier-field-groups/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/supplier-field-groups', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/supplier-field-groups/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/supplier-field-groups/${id}`, { method: 'DELETE' }),
};

// 供应商属性分组相关 API
export const supplierAttributeGroupsApi = {
  list: () => callJavaBackend<unknown>('/api/suppliers/attribute-groups'),

  get: (id: number) => callJavaBackend<unknown>(`/api/suppliers/attribute-groups/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/suppliers/attribute-groups', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/suppliers/attribute-groups/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/suppliers/attribute-groups/${id}`, { method: 'DELETE' }),
};

// 供应商属性相关 API
export const supplierAttributesApi = {
  list: () => callJavaBackend<unknown>('/api/suppliers/attributes'),

  get: (id: number) => callJavaBackend<unknown>(`/api/suppliers/attributes/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/suppliers/attributes', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/suppliers/attributes/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/suppliers/attributes/${id}`, { method: 'DELETE' }),
};

// 供应商属性值相关 API
export const supplierAttributeValuesApi = {
  list: () => callJavaBackend<unknown>('/api/suppliers/attribute-values'),

  getByAttribute: (attributeId: number) => callJavaBackend<unknown>(`/api/suppliers/attribute-values/attribute/${attributeId}`),

  get: (id: number) => callJavaBackend<unknown>(`/api/suppliers/attribute-values/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/suppliers/attribute-values', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/suppliers/attribute-values/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/suppliers/attribute-values/${id}`, { method: 'DELETE' }),
};

// 供应商编码规则相关 API
export const supplierCodeRulesApi = {
  list: () => callJavaBackend<unknown>('/api/suppliers/code-rules'),

  get: (id: number) => callJavaBackend<unknown>(`/api/suppliers/code-rules/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/suppliers/code-rules', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/suppliers/code-rules/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/suppliers/code-rules/${id}`, { method: 'DELETE' }),

  getVariables: () => callJavaBackend<unknown>('/api/suppliers/code-rules/variables'),
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

// 图片分类相关 API
export const imageCategoriesApi = {
  list: () => callJavaBackend<unknown>('/api/images/categories'),

  get: (id: number) => callJavaBackend<unknown>(`/api/images/categories/${id}`),

  create: (data: unknown) => callJavaBackend<unknown>('/api/images/categories', { method: 'POST', body: data }),

  update: (id: number, data: unknown) => callJavaBackend<unknown>(`/api/images/categories/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) => callJavaBackend<unknown>(`/api/images/categories/${id}`, { method: 'DELETE' }),
};
