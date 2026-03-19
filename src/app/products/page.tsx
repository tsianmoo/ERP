'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Search, Eye, Settings, GripVertical, CheckSquare, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'

interface Product {
  id: number
  product_code: string
  product_name: string
  basic_info: Record<string, any>
  attribute_values: Record<string, any>
  status: string
  created_at: string
}

interface AttributeValue {
  id: number
  code: string
  name: string
}

interface FieldOption {
  label: string
  value: string
  source?: string
}

interface BasicField {
  id: number
  field_name: string
  field_code: string
  field_type: string
  sort_order: number
  enabled: boolean
  options?: FieldOption[] | string | null
}

interface Attribute {
  id: number
  name: string
  code: string
  sort_order: number
  enabled: boolean
  product_attribute_values?: AttributeValue[]
}

interface Supplier {
  id: number
  supplier_name: string
  supplier_code: string
}

// 列配置接口 - 与商品属性页面一致
interface ColumnConfig {
  id: string
  name: string
  type: 'fixed' | 'basic' | 'attribute'
  visible: boolean
  flex: number // flex 比例，0 表示固定宽度
  width?: number // 固定宽度（仅 flex 为 0 时使用）
  sortOrder: number
  fieldId?: number
}

// 可排序的列配置项 - 简化版，移除宽度设置
interface SortableColumnItemProps {
  column: ColumnConfig
  onVisibilityChange: (id: string, visible: boolean) => void
}

function SortableColumnItem({ column, onVisibilityChange }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded mb-1 text-xs ${
        isDragging ? 'shadow-md ring-1 ring-blue-400 bg-white' : ''
      } ${!column.visible ? 'opacity-50' : ''}`}
    >
      {/* 拖拽手柄 */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-500 flex-shrink-0">
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* 显示/隐藏开关 */}
      <Switch
        checked={column.visible}
        onCheckedChange={(checked) => onVisibilityChange(column.id, checked)}
        className="scale-75 flex-shrink-0"
      />

      {/* 列名称 */}
      <div className="flex-1 font-medium text-gray-700 truncate min-w-0">
        {column.name}
      </div>

      {/* 列宽提示 */}
      <div className="text-[10px] text-gray-400 flex-shrink-0">
        {column.flex === 0 && column.width ? `${column.width}px` : `flex-${column.flex}`}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [basicFields, setBasicFields] = useState<BasicField[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)

  // 批量选择状态
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
  const [isBatchEditDialogOpen, setIsBatchEditDialogOpen] = useState(false)
  const [batchEditValues, setBatchEditValues] = useState<Record<string, string>>({})

  // 筛选状态
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})

  // 列配置状态
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([])
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false)

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchProducts()
    fetchBasicFields()
    fetchAttributes()
    fetchSuppliers()
  }, [])

  // 当字段加载完成后，初始化列配置
  useEffect(() => {
    if (basicFields.length > 0 || attributes.length > 0) {
      initColumnConfigs()
    }
  }, [basicFields, attributes])

  // 初始化列配置 - 使用固定宽度布局
  const initColumnConfigs = () => {
    const savedConfig = localStorage.getItem('product-list-column-config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        const validConfig = validateColumnConfig(parsed)
        setColumnConfigs(validConfig)
        return
      } catch (e) {
        console.error('Failed to parse column config:', e)
      }
    }

    // 默认列配置 - 使用固定宽度，确保列内容不重叠
    const defaultConfigs: ColumnConfig[] = [
      { id: 'index', name: '序号', type: 'fixed', visible: true, flex: 0, width: 50, sortOrder: 0 },
      { id: 'product_code', name: '货号', type: 'fixed', visible: true, flex: 0, width: 100, sortOrder: 1 },
    ]

    let sortOrder = 2
    basicFields.forEach((field) => {
      // 根据字段名设置不同的宽度
      let defaultWidth = 100
      if (field.field_code === 'product_name') {
        defaultWidth = 180 // 品名需要更宽
      } else if (field.field_name.includes('供应商')) {
        defaultWidth = 120 // 供应商需要更宽
      } else if (field.field_name.includes('标准') || field.field_name.includes('技术')) {
        defaultWidth = 120 // 标准类字段需要更宽
      } else if (field.field_type === 'boolean') {
        defaultWidth = 80 // 布尔类型较窄
      }
      
      defaultConfigs.push({
        id: `basic_${field.id}`,
        name: field.field_name,
        type: 'basic',
        visible: true,
        flex: 0,
        width: defaultWidth,
        sortOrder: sortOrder++,
        fieldId: field.id,
      })
    })

    attributes.forEach((attr) => {
      defaultConfigs.push({
        id: `attr_${attr.id}`,
        name: attr.name,
        type: 'attribute',
        visible: true,
        flex: 0,
        width: 80,
        sortOrder: sortOrder++,
        fieldId: attr.id,
      })
    })

    defaultConfigs.push(
      { id: 'status', name: '状态', type: 'fixed', visible: true, flex: 0, width: 80, sortOrder: sortOrder++ },
      { id: 'created_at', name: '创建时间', type: 'fixed', visible: true, flex: 0, width: 100, sortOrder: sortOrder++ },
      { id: 'actions', name: '操作', type: 'fixed', visible: true, flex: 0, width: 180, sortOrder: sortOrder }
    )

    setColumnConfigs(defaultConfigs)
  }

  // 验证列配置 - 统一使用固定宽度
  const validateColumnConfig = (savedConfig: ColumnConfig[]): ColumnConfig[] => {
    const validIds = new Set<string>()
    
    validIds.add('index')
    validIds.add('product_code')
    validIds.add('status')
    validIds.add('created_at')
    validIds.add('actions')
    
    basicFields.forEach(f => validIds.add(`basic_${f.id}`))
    attributes.forEach(a => validIds.add(`attr_${a.id}`))

    // 过滤有效配置，统一转换为固定宽度
    let filtered = savedConfig.filter(c => validIds.has(c.id)).map(c => {
      // 确保所有列都有宽度
      if (!c.width) {
        if (c.id === 'index') return { ...c, flex: 0, width: 50 }
        if (c.id === 'product_code') return { ...c, flex: 0, width: 100 }
        if (c.id === 'actions') return { ...c, flex: 0, width: 180 }
        if (c.id === 'status') return { ...c, flex: 0, width: 80 }
        if (c.id === 'created_at') return { ...c, flex: 0, width: 100 }
        return { ...c, flex: 0, width: 100 }
      }
      return { ...c, flex: 0 }
    })
    
    const existingIds = new Set(filtered.map(c => c.id))
    let maxSortOrder = Math.max(...filtered.map(c => c.sortOrder), 0)

    basicFields.forEach((field) => {
      const configId = `basic_${field.id}`
      if (!existingIds.has(configId)) {
        // 根据字段名设置不同的宽度
        let defaultWidth = 100
        if (field.field_code === 'product_name') {
          defaultWidth = 180
        } else if (field.field_name.includes('供应商')) {
          defaultWidth = 120
        } else if (field.field_name.includes('标准') || field.field_name.includes('技术')) {
          defaultWidth = 120
        } else if (field.field_type === 'boolean') {
          defaultWidth = 80
        }
        
        filtered.push({
          id: configId,
          name: field.field_name,
          type: 'basic',
          visible: true,
          flex: 0,
          width: defaultWidth,
          sortOrder: ++maxSortOrder,
          fieldId: field.id,
        })
      }
    })

    attributes.forEach((attr) => {
      const configId = `attr_${attr.id}`
      if (!existingIds.has(configId)) {
        filtered.push({
          id: configId,
          name: attr.name,
          type: 'attribute',
          visible: true,
          flex: 0,
          width: 80,
          sortOrder: ++maxSortOrder,
          fieldId: attr.id,
        })
      }
    })

    return filtered
  }

  // 保存列配置到 localStorage
  const saveColumnConfig = useCallback((configs: ColumnConfig[]) => {
    localStorage.setItem('product-list-column-config', JSON.stringify(configs))
  }, [])

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumnConfigs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          sortOrder: index,
        }))
        saveColumnConfig(newItems)
        return newItems
      })
    }
  }

  // 切换列显示
  const handleVisibilityChange = (id: string, visible: boolean) => {
    setColumnConfigs((configs) => {
      const newConfigs = configs.map((c) => 
        c.id === id ? { ...c, visible } : c
      )
      saveColumnConfig(newConfigs)
      return newConfigs
    })
  }

  // 重置列配置
  const handleResetColumns = () => {
    localStorage.removeItem('product-list-column-config')
    initColumnConfigs()
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const result = await response.json()
      if (result.data) {
        setProducts(result.data)
      }
    } catch (error) {
      console.error('获取商品列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBasicFields = async () => {
    try {
      const response = await fetch('/api/products/basic-fields')
      const result = await response.json()
      if (result.data) {
        // 按分组sort_order和字段sort_order排序
        const enabledFields = result.data
          .filter((field: any) => field.enabled !== false)
          .sort((a: any, b: any) => {
            // 先按分组的 sort_order 排序
            const aGroupSortOrder = a.field_group?.sort_order ?? 999999
            const bGroupSortOrder = b.field_group?.sort_order ?? 999999
            if (aGroupSortOrder !== bGroupSortOrder) {
              return aGroupSortOrder - bGroupSortOrder
            }
            // 同一分组内按 sort_order 排序
            return (a.sort_order || 0) - (b.sort_order || 0)
          })
        const filteredFields = enabledFields.filter(
          (field: any) => field.field_code !== 'product_code'
        )
        setBasicFields(filteredFields)
      }
    } catch (error) {
      console.error('获取基本信息字段失败:', error)
    }
  }

  const fetchAttributes = async () => {
    try {
      const response = await fetch('/api/products/attributes')
      const result = await response.json()
      if (result.data) {
        const enabledAttributes = result.data
          .filter((attr: any) => attr.enabled !== false)
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
        setAttributes(enabledAttributes)
      }
    } catch (error) {
      console.error('获取属性配置失败:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const result = await response.json()
      if (result.data) {
        setSuppliers(result.data)
      }
    } catch (error) {
      console.error('获取供应商列表失败:', error)
    }
  }

  // 获取字段值的显示文本
  const getFieldDisplayValue = (field: BasicField, value: any): string => {
    if (value === null || value === undefined || value === '') return '-'
    
    // 处理对象类型的值（如 {"value": "2", "source": "supplier"}）
    if (typeof value === 'object' && value !== null) {
      // 如果有 value 字段，提取它
      if (value.value !== undefined) {
        value = value.value
      } else {
        // 否则返回 '-' 表示无法显示
        return '-'
      }
    }
    
    if (value === null || value === undefined || value === '') return '-'
    
    // 布尔值类型处理
    if (field.field_type === 'boolean') {
      if (value === true || value === 'true' || value === 1 || value === '1') return '是'
      if (value === false || value === 'false' || value === 0 || value === '0') return '否'
      return '-'
    }
    
    if (field.options && Array.isArray(field.options)) {
      const option = field.options.find(opt => String(opt.value) === String(value))
      if (option) return option.label
    }
    
    if (field.options && typeof field.options === 'string') {
      const options = field.options.split(',')
      const index = parseInt(value)
      if (!isNaN(index) && options[index]) return options[index]
    }
    
    // 处理供应商字段
    if (field.field_code === 'supplier_id' || 
        field.field_code === 'supplierId' || 
        field.field_code === 'supplier') {
      const supplier = suppliers.find(s => String(s.id) === String(value))
      if (supplier) return supplier.supplier_name
    }
    
    return String(value)
  }

  // 获取属性值显示名称
  const getAttributeValueDisplay = (attr: Attribute, value: any): string => {
    if (value === null || value === undefined || value === '') return '-'
    
    if (attr.product_attribute_values && attr.product_attribute_values.length > 0) {
      const attrValue = attr.product_attribute_values.find(v => String(v.code) === String(value))
      if (attrValue) return attrValue.name
    }
    
    return String(value)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setProducts(products.filter(p => p.id !== id))
        setIsDeleteDialogOpen(false)
      }
    } catch (error) {
      console.error('删除商品失败:', error)
    }
  }

  const filteredProducts = products.filter(product => {
    // 搜索条件
    const matchesSearch = 
      (product.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.product_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.basic_info?.product_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    // 状态筛选
    if (filterValues['status'] && filterValues['status'] !== product.status) {
      return false
    }
    
    // 筛选条件
    for (const [key, value] of Object.entries(filterValues)) {
      if (!value || key === 'status') continue
      
      // 检查基本信息字段
      const basicField = basicFields.find(f => f.field_code === key)
      if (basicField) {
        const fieldValue = product.basic_info?.[key]
        if (String(fieldValue || '') !== value) return false
        continue
      }
      
      // 检查属性字段
      const attr = attributes.find(a => a.code === key)
      if (attr) {
        const attrValue = product.attribute_values?.[key]
        if (String(attrValue || '') !== value) return false
      }
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--page-padding)' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--section-gap)' }}>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">商品列表</h1>
        <p className="text-gray-600 text-sm">管理所有商品信息</p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索商品名称或货号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* 状态筛选 */}
          <Select 
            value={filterValues['status'] || 'all'} 
            onValueChange={(value) => setFilterValues({ ...filterValues, status: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="draft">待启用</SelectItem>
              <SelectItem value="inactive">禁用</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(true)}
            className={Object.keys(filterValues).some(k => filterValues[k]) ? 'text-blue-600 border-blue-300' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            筛选
            {Object.keys(filterValues).filter(k => filterValues[k]).length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {Object.keys(filterValues).filter(k => filterValues[k]).length}
              </Badge>
            )}
          </Button>
          {Object.keys(filterValues).some(k => filterValues[k]) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setFilterValues({})}
              className="text-gray-500"
            >
              <X className="h-4 w-4 mr-1" />
              清除筛选
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedProductIds.size > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setIsBatchEditDialogOpen(true)}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              批量修改 ({selectedProductIds.size})
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsColumnSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            列设置
          </Button>
          <Link href="/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加商品
            </Button>
          </Link>
        </div>
      </div>

      {/* Product Table - 使用 table 布局确保列对齐 */}
      <div 
        className="bg-white overflow-hidden w-full"
        style={{ 
          borderRadius: 'var(--card-radius)',
          borderWidth: 'var(--card-border-width)',
          borderColor: 'var(--border-color)',
          borderStyle: 'solid'
        }}
      >
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 'max-content' }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 h-10">
                  {/* 复选框列 */}
                  <th className="w-9 min-w-9 px-2 text-center">
                    <Checkbox
                      checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id))}
                      ref={(ref) => {
                        if (ref) {
                          const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id))
                          const someSelected = filteredProducts.some(p => selectedProductIds.has(p.id))
                          ;(ref as HTMLButtonElement).dataset.state = someSelected && !allSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'
                        }
                      }}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProductIds(new Set(filteredProducts.map(p => p.id)))
                        } else {
                          setSelectedProductIds(new Set())
                        }
                      }}
                      className="m-0"
                    />
                  </th>
                  {/* 动态列 */}
                  {columnConfigs
                    .filter(c => c.visible && c.id !== 'actions')
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((column) => (
                      <th
                        key={column.id}
                        className="px-3 text-xs font-medium text-gray-500 whitespace-nowrap text-center"
                      >
                        {column.name}
                      </th>
                    ))}
                  {/* 操作列 */}
                  <th className="px-3 text-xs font-medium text-gray-500 whitespace-nowrap text-center w-44 min-w-44">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={columnConfigs.filter(c => c.visible).length + 2} className="p-12 text-center text-gray-500">
                      暂无商品数据
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors h-11">
                      {/* 复选框 */}
                      <td className="w-9 min-w-9 px-2 text-center">
                        <Checkbox
                          checked={selectedProductIds.has(product.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedProductIds)
                            if (checked) {
                              newSet.add(product.id)
                            } else {
                              newSet.delete(product.id)
                            }
                            setSelectedProductIds(newSet)
                          }}
                          className="m-0"
                        />
                      </td>
                      {/* 动态列 */}
                      {columnConfigs
                        .filter(c => c.visible && c.id !== 'actions')
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((column) => {
                          let content: React.ReactNode = '-'

                          switch (column.id) {
                            case 'index':
                              content = <span className="text-sm text-gray-600">{index + 1}</span>
                              break
                            case 'product_code':
                              content = <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{product.product_code}</span>
                              break
                            case 'status':
                              content = product.status === 'active' 
                                ? <Badge className="bg-green-500 hover:bg-green-600 text-xs">启用</Badge>
                                : product.status === 'draft'
                                ? <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-xs">待启用</Badge>
                                : <Badge variant="secondary" className="text-xs">禁用</Badge>
                              break
                            case 'created_at':
                              content = <span className="text-sm text-gray-600 whitespace-nowrap">{new Date(product.created_at).toLocaleDateString('zh-CN')}</span>
                              break
                            default:
                              if (column.type === 'basic' && column.fieldId) {
                                const field = basicFields.find(f => f.id === column.fieldId)
                                if (field) {
                                  let value = product.basic_info?.[field.field_code]
                                  if ((value === null || value === undefined || value === '') && 
                                      (field.field_code === 'supplier' || field.field_code === 'supplier_id')) {
                                    value = product.basic_info?.supplier_id || product.basic_info?.supplier
                                  }
                                  content = <span className="text-sm text-gray-600 whitespace-nowrap">{getFieldDisplayValue(field, value)}</span>
                                }
                              }
                              else if (column.type === 'attribute' && column.fieldId) {
                                const attr = attributes.find(a => a.id === column.fieldId)
                                if (attr) {
                                  content = <span className="text-sm text-gray-600 whitespace-nowrap">{getAttributeValueDisplay(attr, product.attribute_values?.[attr.code])}</span>
                                }
                              }
                          }

                          return (
                            <td key={column.id} className="px-3 text-center whitespace-nowrap">
                              {content}
                            </td>
                          )
                        })}
                      {/* 操作列 */}
                      <td className="px-2 text-center whitespace-nowrap">
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => router.push(`/products/${product.id}/view`)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            查看
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => router.push(`/products/${product.id}/edit`)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setProductToDelete(product.id)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">确定要删除此商品吗？此操作不可恢复。</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => productToDelete && handleDelete(productToDelete)}
            >
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100">
            <DialogTitle className="text-sm font-medium text-gray-900">筛选商品</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col max-h-[calc(80vh-120px)]">
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {/* 基本信息字段筛选 */}
              {basicFields.length > 0 && (
                <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                  <div className="text-xs font-medium text-gray-600 mb-2">基本信息</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {basicFields.filter(f => f.field_type === 'select' && f.options && Array.isArray(f.options) && f.options.length > 0).map((field) => {
                      const options = field.options as FieldOption[]
                      return (
                      <div key={field.id}>
                        <Label className="text-xs text-gray-500 mb-1 block">{field.field_name}</Label>
                        <Select
                          value={filterValues[field.field_code] || ''}
                          onValueChange={(value) => {
                            if (value === '__all__') {
                              const newFilters = { ...filterValues }
                              delete newFilters[field.field_code]
                              setFilterValues(newFilters)
                            } else {
                              setFilterValues({
                                ...filterValues,
                                [field.field_code]: value,
                              })
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full">
                            <SelectValue placeholder="全部" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__" className="text-xs">
                              <span className="text-gray-400">全部</span>
                            </SelectItem>
                            {options.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )})}
                  </div>
                </div>
              )}
              
              {/* 商品属性筛选 */}
              {attributes.length > 0 && (
                <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                  <div className="text-xs font-medium text-gray-600 mb-2">商品属性</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {attributes.filter(attr => attr.product_attribute_values && attr.product_attribute_values.length > 0).map((attr) => (
                      <div key={attr.id}>
                        <Label className="text-xs text-gray-500 mb-1 block">{attr.name}</Label>
                        <Select
                          value={filterValues[attr.code] || ''}
                          onValueChange={(value) => {
                            if (value === '__all__') {
                              const newFilters = { ...filterValues }
                              delete newFilters[attr.code]
                              setFilterValues(newFilters)
                            } else {
                              setFilterValues({
                                ...filterValues,
                                [attr.code]: value,
                              })
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full">
                            <SelectValue placeholder="全部" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__" className="text-xs">
                              <span className="text-gray-400">全部</span>
                            </SelectItem>
                            {attr.product_attribute_values?.map((val) => (
                              <SelectItem key={val.id} value={val.code} className="text-xs">
                                {val.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {basicFields.filter(f => f.field_type === 'select').length === 0 && attributes.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">暂无可筛选的字段</p>
              )}
            </div>
            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                setFilterValues({})
                setIsFilterOpen(false)
              }} className="h-8 text-xs">
                清除筛选
              </Button>
              <Button type="button" size="sm" onClick={() => setIsFilterOpen(false)} className="h-8 text-xs bg-blue-500 hover:bg-blue-600">
                应用筛选
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Edit Dialog */}
      <Dialog open={isBatchEditDialogOpen} onOpenChange={setIsBatchEditDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100">
            <DialogTitle className="text-sm font-medium text-gray-900">批量修改商品属性</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col max-h-[calc(80vh-120px)]">
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <p className="text-xs text-gray-500 mb-3">
                已选择 <span className="font-medium text-blue-600">{selectedProductIds.size}</span> 个商品，将批量修改以下属性：
              </p>
              <div className="bg-gray-50/80 rounded-md p-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {attributes.map((attr) => (
                    <div key={attr.id}>
                      <Label className="text-xs text-gray-500 mb-1 block">{attr.name}</Label>
                      <Select
                        value={batchEditValues[attr.code] || ''}
                        onValueChange={(value) => {
                          if (value === '__clear__') {
                            const newValues = { ...batchEditValues }
                            delete newValues[attr.code]
                            setBatchEditValues(newValues)
                          } else {
                            setBatchEditValues({
                              ...batchEditValues,
                              [attr.code]: value,
                            })
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full">
                          <SelectValue placeholder="选择..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__clear__" className="text-xs">
                            <span className="text-gray-400">-- 不修改 --</span>
                          </SelectItem>
                          {attr.product_attribute_values?.map((val) => (
                            <SelectItem key={val.id} value={val.code} className="text-xs">
                              {val.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                {attributes.length === 0 && (
                  <p className="text-center text-gray-400 py-6 text-sm">暂无可修改的属性</p>
                )}
              </div>
            </div>
            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                setIsBatchEditDialogOpen(false)
                setBatchEditValues({})
              }} className="h-8 text-xs">
                取消
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  if (Object.keys(batchEditValues).length === 0) {
                    return
                  }
                  
                  try {
                    const response = await fetch('/api/products/batch-update', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        productIds: Array.from(selectedProductIds),
                        attributeValues: batchEditValues,
                      }),
                    })
                    
                    if (response.ok) {
                      setIsBatchEditDialogOpen(false)
                      setSelectedProductIds(new Set())
                      setBatchEditValues({})
                      fetchProducts()
                    } else {
                      const error = await response.json()
                      console.error('批量修改失败:', error)
                    }
                  } catch (error) {
                    console.error('批量修改失败:', error)
                  }
                }}
                disabled={Object.keys(batchEditValues).length === 0}
                className="h-8 text-xs bg-blue-500 hover:bg-blue-600"
              >
                确认修改
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Column Settings Dialog - Full Screen */}
      <Dialog open={isColumnSettingsOpen} onOpenChange={setIsColumnSettingsOpen}>
        <DialogContent className="max-w-3xl w-[90vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">列设置</DialogTitle>
              <Button variant="outline" size="sm" onClick={handleResetColumns} className="h-7 text-xs">
                重置默认
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {/* 列配置列表 */}
            <div className="px-4 py-3">
              <div className="text-xs font-medium text-gray-700 mb-2">列配置 <span className="text-gray-400 font-normal">(拖动调整顺序)</span></div>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={columnConfigs.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnConfigs
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((column) => (
                      <SortableColumnItem
                        key={column.id}
                        column={column}
                        onVisibilityChange={handleVisibilityChange}
                      />
                    ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 pb-3 px-4 border-t flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setIsColumnSettingsOpen(false)} className="h-8">
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
