'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Loader2, Search, ChevronRight, GripVertical, Settings2, GripHorizontal, Type, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ColumnConfig {
  key: string
  label: string
  flex: number // flex 比例，0 表示固定宽度
  width?: number // 固定宽度（仅 flex 为 0 时使用）
  freezable?: boolean
  defaultVisible?: boolean
}

interface ColumnSettings {
  key: string
  visible: boolean
  frozen: boolean
}

interface AttributeGroup {
  id: number
  name: string
  sort_order: number
}

interface AttributeValue {
  id: number
  attribute_id: number
  name: string
  code: string
  parent_id: number | null
  sort_order: number
}

interface Attribute {
  id: number
  name: string
  code: string
  field_code: string // 数据库字段名
  sort_order: number
  code_length: number
  enabled: boolean
  product_attribute_values?: AttributeValue[]
  // Layout configuration
  width: number
  columns: number
  column_width: number
  spacing: number
  row_index: number
  new_row: boolean
  group_sort_order: number
  is_required: boolean
  // Group
  group_id: number | null
  product_attribute_groups?: {
    id: number
    name: string
  } | null
}

// 属性值列表组件
function AttributeValueList({
  attribute,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}: {
  attribute: Attribute
  onEdit: (value: AttributeValue) => void
  onDelete: (id: number) => void
  onMoveUp: (attributeId: number, originalIndex: number) => void
  onMoveDown: (attributeId: number, originalIndex: number) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const allValues = attribute.product_attribute_values || []
  const filteredValues = searchQuery
    ? allValues.filter(value =>
        value.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        value.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allValues

  if (allValues.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-400">暂无属性值，点击"添加值"添加</p>
      </div>
    )
  }

  return (
    <>
      {/* 表头 */}
      <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs">
        <span className="w-8 text-gray-500"></span>
        <span className="w-8 text-gray-500 text-center">序号</span>
        <span className="w-16 text-gray-500 text-center">排序</span>
        <span className="flex-1 text-gray-500">属性名</span>
        <span className="w-20 text-gray-500 text-center">数据库字段名</span>
        <span className="w-24 text-gray-500 text-center">操作</span>
      </div>

      {/* 数据行 */}
      {filteredValues.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">未找到匹配的属性值</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filteredValues.map((value) => {
            const originalIndex = allValues.findIndex(v => v.id === value.id)
            return (
              <div
                key={value.id}
                className="flex items-center gap-1 px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                {/* 拖拽手柄 */}
                <div className="w-8 flex justify-center">
                  <GripVertical className="h-4 w-4 text-gray-300 cursor-move" />
                </div>

                {/* 序号 */}
                <span className="w-8 text-sm text-gray-600 text-center">{originalIndex + 1}</span>

                {/* 排序按钮 */}
                <div className="w-16 flex items-center justify-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                    onClick={() => onMoveUp(attribute.id, originalIndex)}
                    disabled={originalIndex === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                    onClick={() => onMoveDown(attribute.id, originalIndex)}
                    disabled={originalIndex >= allValues.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* 属性值名称 */}
                <span className="flex-1 text-sm text-gray-900">{value.name}</span>

                {/* 编码 */}
                <div className="w-20 flex justify-center">
                  <Badge variant="outline" className="text-sm font-mono">
                    {value.code}
                  </Badge>
                </div>

                {/* 操作按钮 */}
                <div className="w-24 flex items-center justify-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900"
                        onClick={() => onEdit(value)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>编辑</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-600 hover:text-red-600"
                        onClick={() => onDelete(value.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>删除</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// 可排序的表头单元格组件
function SortableHeaderCell({
  id,
  children,
  flex,
  width,
  isSelected,
  onSelect,
  isCheckbox = false,
}: {
  id: string
  children: React.ReactNode
  flex: number
  width?: number
  isSelected?: boolean
  onSelect?: (columnKey: string) => void
  isCheckbox?: boolean
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // flex 为 0 表示固定宽度，否则使用 flex 比例 + 最小宽度
    ...(flex === 0 && width ? { width: `${width}px`, flexShrink: 0 } : { flex: flex, minWidth: '60px' }),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative flex items-center justify-center text-xs font-medium select-none text-gray-500 bg-gray-50 h-10 whitespace-nowrap
        ${isCheckbox ? 'pl-4 pr-2' : 'px-3'}
        ${isSelected
          ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-300'
          : ''
        }
        transition-colors
        ${isDragging ? 'opacity-50' : ''}
      `}
      onClick={() => onSelect?.(id)}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

// 可拖拽的分组项组件
function SortableGroupItem({
  group,
  isSelected,
  isEditing,
  editingName,
  onSelect,
  onEdit,
  onDelete,
  onEditChange,
  onEditSubmit,
  onEditCancel,
}: {
  group: AttributeGroup
  isSelected: boolean
  isEditing: boolean
  editingName: string
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onEditChange: (value: string) => void
  onEditSubmit: () => void
  onEditCancel: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 border px-3 py-1.5 rounded-sm cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-blue-300'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      } ${isDragging ? 'shadow-lg' : ''}`}
      onClick={onSelect}
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-gray-100 rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
      </div>

      {isEditing ? (
        <input
          type="text"
          value={editingName}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onEditSubmit()
            } else if (e.key === 'Escape') {
              onEditCancel()
            }
          }}
          onBlur={onEditSubmit}
          onClick={(e) => e.stopPropagation()}
          autoFocus
          className="w-24 px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <span className="text-sm text-gray-700">{group.name}</span>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600"
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
      >
        <Edit className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 text-gray-400 hover:text-red-600"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

// 常用词汇映射（中文到英文拼音）
const commonChineseMap: Record<string, string> = {
  '货号': 'product_code',
  '商品名称': 'product_name',
  '商品': 'product',
  '名称': 'name',
  '品牌': 'brand',
  '供应商': 'supplier',
  '颜色': 'color',
  '尺码': 'size',
  '规格': 'specification',
  '价格': 'price',
  '单价': 'unit_price',
  '数量': 'quantity',
  '库存': 'stock',
  '重量': 'weight',
  '长度': 'length',
  '宽度': 'width',
  '高度': 'height',
  '成本': 'cost',
  '折扣': 'discount',
  '分类': 'category',
  '类型': 'type',
  '状态': 'status',
  '备注': 'remark',
  '描述': 'description',
  '图片': 'image',
  '创建时间': 'created_at',
  '更新时间': 'updated_at',
  '生产厂家': 'manufacturer',
  '产地': 'origin',
  '材质': 'material',
  '款式': 'style',
  '系列': 'series',
  '季节': 'season',
  '年份': 'year',
  '款号': 'style_code',
  '条码': 'barcode',
  '上架时间': 'publish_date',
  '下架时间': 'unpublish_date',
  '零售价': 'retail_price',
  '批发价': 'wholesale_price',
  '建议零售价': 'msrp',
  '市场价': 'market_price',
}

// 自动生成数据库字段名
const generateFieldCode = (fieldName: string): string => {
  if (!fieldName) return ''
  
  let result = fieldName.trim()
  
  // 检查是否在常用映射表中
  for (const [chinese, english] of Object.entries(commonChineseMap)) {
    if (result === chinese) {
      return english
    }
    // 处理包含常用词的情况（如"商品名称" -> "product_name"）
    result = result.replace(new RegExp(chinese, 'g'), english)
  }
  
  // 转换为小写
  result = result.toLowerCase()
  
  // 将空格和特殊字符替换为下划线
  result = result.replace(/[\s\-–—]+/g, '_')
  
  // 只保留小写字母、数字和下划线
  result = result.replace(/[^a-z0-9_]/g, '_')
  
  // 将连续的下划线替换为单个下划线
  result = result.replace(/_{2,}/g, '_')
  
  // 去除开头和结尾的下划线
  result = result.replace(/^_+|_+$/g, '')
  
  // 确保不以数字开头
  if (/^[0-9]/.test(result)) {
    result = 'field_' + result
  }
  
  // 如果结果为空，使用默认值
  if (!result) {
    result = 'custom_field'
  }
  
  return result
}

export default function AttributesPage() {
  const defaultColumns: ColumnConfig[] = [
    // 固定宽度列
    { key: 'checkbox', label: '', flex: 0, width: 36, freezable: true, defaultVisible: true },
    { key: 'index', label: '序号', flex: 0, width: 50, freezable: true, defaultVisible: true },
    { key: 'drag', label: '排序', flex: 0, width: 50, freezable: false, defaultVisible: true },

    // 弹性宽度列 - 核心业务
    { key: 'group', label: '分组', flex: 2, freezable: true, defaultVisible: true },
    { key: 'name', label: '属性名称', flex: 3, freezable: true, defaultVisible: true },
    { key: 'code', label: '数据库字段名', flex: 2, freezable: true, defaultVisible: false },
    { key: 'valueCount', label: '子属性数', flex: 1.5, freezable: false, defaultVisible: true },
    { key: 'codeLength', label: '子属性代码', flex: 1.5, freezable: false, defaultVisible: true },
    { key: 'rowIndex', label: '行号', flex: 1, freezable: false, defaultVisible: true },

    // 弹性宽度列 - 布局配置
    { key: 'columns', label: '列数', flex: 1, freezable: false, defaultVisible: true },
    { key: 'columnWidth', label: '列宽', flex: 1, freezable: false, defaultVisible: true },
    { key: 'width', label: '宽度', flex: 1, freezable: false, defaultVisible: true },
    { key: 'spacing', label: '间距', flex: 1, freezable: false, defaultVisible: true },
    { key: 'newRow', label: '新行', flex: 1, freezable: false, defaultVisible: true },

    // 弹性宽度列 - 状态
    { key: 'isRequired', label: '必选', flex: 1, freezable: false, defaultVisible: true },
    { key: 'enabled', label: '启用', flex: 1, freezable: false, defaultVisible: true },

    // 固定宽度列 - 操作
    { key: 'actions', label: '操作', flex: 0, width: 180, freezable: false, defaultVisible: true },
  ]

  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false)
  const [isEditValueDialogOpen, setIsEditValueDialogOpen] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null)
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isManageValuesDialogOpen, setIsManageValuesDialogOpen] = useState(false)
  const [managingAttribute, setManagingAttribute] = useState<Attribute | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    fieldCode: '', // 数据库字段名
    codeLength: 2,
    enabled: true,
    isRequired: false,
    group: '',
    // Layout configuration
    width: 100,
    columns: 1,
    columnWidth: 1,
    spacing: 2,
    rowIndex: 1,
    newRow: false,
    groupSortOrder: 0,
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    fieldCode: '', // 数据库字段名
    codeLength: 2,
    enabled: true,
    // Layout configuration
    width: 100,
    columns: 1,
    columnWidth: 1,
    spacing: 2,
    rowIndex: 1,
    newRow: false,
    groupSortOrder: 0,
    isRequired: false,
    group: '',
  })
  const [valueFormData, setValueFormData] = useState({
    name: '',
    code: '',
    parentId: null as number | null,
  })
  const { toast } = useToast()

  // 分组管理相关 state
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([])
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [groupSubmitting, setGroupSubmitting] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')

  // 换行控制
  const [allowWrap, setAllowWrap] = useState(false)

  // 批量编辑相关
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false)
  const [batchFormData, setBatchFormData] = useState({
    group: { value: '', enabled: false },
    width: { value: 100, enabled: false },
    columns: { value: 1, enabled: false },
    columnWidth: { value: 1, enabled: false },
    spacing: { value: 2, enabled: false },
    rowIndex: { value: 1, enabled: false },
    groupSortOrder: { value: 0, enabled: false },
    isRequired: { value: false, enabled: false },
  })

  // 列设置相关 - 直接使用默认设置
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false)
  const [columnSettings, setColumnSettings] = useState<ColumnSettings[]>(() => {
    return defaultColumns.map(col => ({
      key: col.key,
      visible: col.defaultVisible !== false,
      frozen: false,
    }))
  })
  const [tempColumnSettings, setTempColumnSettings] = useState<ColumnSettings[]>([])
  const [tempColumnOrder, setTempColumnOrder] = useState<string[]>([]) // 临时列顺序

  // 列管理相关 state - 直接使用默认顺序
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    return defaultColumns.map(c => c.key)
  })

  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)

  useEffect(() => {
    // 检查 localStorage 中的列顺序是否缺少新列
    if (typeof window !== 'undefined') {
      const savedOrder = localStorage.getItem('attributeColumnOrder')
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder)
        // 检查是否缺少 'group' 列
        if (!parsedOrder.includes('group')) {
          // 使用新的默认顺序
          const newOrder = defaultColumns.map(c => c.key)
          setColumnOrder(newOrder)
          localStorage.setItem('attributeColumnOrder', JSON.stringify(newOrder))
          console.log('列顺序已更新，新增 group 列')
        }
      }
    }
    
    const loadData = async () => {
      await Promise.all([fetchAttributes(), fetchAttributeGroups()])
    }
    loadData()
  }, [])

  const fetchAttributeGroups = async () => {
    try {
      const response = await fetch('/api/products/attribute-groups')
      const result = await response.json()
      if (result.data) {
        setAttributeGroups(result.data)
      }
    } catch (error) {
      console.error('获取分组列表失败:', error)
    }
  }

  // 同步列设置到列顺序（保存时调用）
  const syncColumnSettings = (settings: ColumnSettings[], order?: string[]) => {
    const newOrder = order || settings.map(s => s.key)

    setColumnOrder(newOrder)

    // 保存到 localStorage
    localStorage.setItem('attributeColumnSettings', JSON.stringify(settings))
    localStorage.setItem('attributeColumnOrder', JSON.stringify(newOrder))
  }

  // 初始化列设置（确保所有列都在）
  useEffect(() => {
    const saved = localStorage.getItem('attributeColumnSettings')
    if (saved) {
      const savedSettings = JSON.parse(saved)
      const existingKeys = new Set(savedSettings.map((s: ColumnSettings) => s.key))
      
      // 检查是否有新列
      const hasNewColumns = defaultColumns.some(col => !existingKeys.has(col.key))
      
      if (hasNewColumns) {
        // 合并保存的设置和默认设置
        const mergedSettings = defaultColumns.map(col => {
          const existing = savedSettings.find((s: ColumnSettings) => s.key === col.key)
          return existing || {
            key: col.key,
            visible: col.defaultVisible !== false,
            frozen: false,
          }
        })
        setColumnSettings(mergedSettings)
      }
    }
  }, [])

  const fetchAttributes = async () => {
    try {
      const response = await fetch('/api/products/attributes')
      const result = await response.json()
      if (result.data) {
        const sortedData = result.data
          .map((attr: Attribute) => ({
            ...attr,
            product_attribute_values: (attr.product_attribute_values || [])
              .sort((a: AttributeValue, b: AttributeValue) => a.sort_order - b.sort_order)
          }))
          .sort((a: Attribute, b: Attribute) => a.sort_order - b.sort_order)
        
        setAttributes(sortedData)
        return sortedData
      }
    } catch (error) {
      console.error('获取属性列表失败:', error)
      toast({
        variant: 'destructive',
        title: '加载失败',
        description: '无法加载属性列表',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { group, ...bodyData } = formData
      
      // 计算新属性的 sort_order，确保新属性添加到列表最后
      const maxSortOrder = attributes.length > 0
        ? Math.max(...attributes.map(a => a.sort_order))
        : -1
      
      const requestBody: any = { 
        ...bodyData,
        sortOrder: maxSortOrder + 1,
      }
      // 正确处理 group_id：确保空字符串或 undefined 都转为 null
      if (group && group.trim() !== '') {
        const parsedId = parseInt(group, 10)
        if (!isNaN(parsedId)) {
          requestBody.group_id = parsedId
        }
      }

      const response = await fetch('/api/products/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        fetchAttributes()
        setFormData({ name: '', fieldCode: '', codeLength: 2, enabled: true, isRequired: false, group: '', width: 100, columns: 1, columnWidth: 1, spacing: 2, rowIndex: 1, newRow: false, groupSortOrder: 0 })
        toast({
          title: '添加成功',
          description: '属性分类已添加',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || '添加失败')
      }
    } catch (error) {
      console.error('添加属性失败:', error)
      toast({
        variant: 'destructive',
        title: '添加失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 列拖拽结束处理
  const handleColumnDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id)
        const newIndex = items.indexOf(over.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        if (typeof window !== 'undefined') {
          localStorage.setItem('attributeColumnOrder', JSON.stringify(newOrder))
        }
        return newOrder
      })
    }
  }

  // 列设置处理函数（操作临时状态）
  const handleToggleColumnVisible = (key: string) => {
    setTempColumnSettings(prev => prev.map(setting =>
      setting.key === key ? { ...setting, visible: !setting.visible } : setting
    ))
  }

  const handleToggleColumnFrozen = (key: string) => {
    setTempColumnSettings(prev => prev.map(setting =>
      setting.key === key ? { ...setting, frozen: !setting.frozen } : setting
    ))
  }

  // 列排序处理函数
  const handleMoveColumnUp = (key: string) => {
    setTempColumnOrder(prev => {
      const index = prev.indexOf(key)
      if (index <= 0) return prev
      const newOrder = [...prev]
      ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
      return newOrder
    })
  }

  const handleMoveColumnDown = (key: string) => {
    setTempColumnOrder(prev => {
      const index = prev.indexOf(key)
      if (index < 0 || index >= prev.length - 1) return prev
      const newOrder = [...prev]
      ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
      return newOrder
    })
  }

  const handleResetColumnSettings = () => {
    const defaultSettings = defaultColumns.map(col => ({
      key: col.key,
      visible: col.defaultVisible !== false,
      frozen: false,
    }))
    setTempColumnSettings(defaultSettings)
    setTempColumnOrder(defaultColumns.map(c => c.key)) // 重置列顺序
    toast({
      title: '列设置已重置',
      description: '列显示、冻结已恢复为默认值',
    })
  }

  // 保存列设置
  const handleSaveColumnSettings = () => {
    setColumnSettings(tempColumnSettings)
    syncColumnSettings(tempColumnSettings, tempColumnOrder) // 传递临时列顺序
    setIsColumnSettingsOpen(false)
    toast({
      title: '保存成功',
      description: '列设置已更新',
    })
  }

  // 取消列设置
  const handleCancelColumnSettings = () => {
    setIsColumnSettingsOpen(false)
  }

  // 打开列设置对话框时初始化临时状态
  const handleOpenColumnSettings = () => {
    setTempColumnSettings([...columnSettings])
    setTempColumnOrder([...columnOrder]) // 初始化临时列顺序
    setIsColumnSettingsOpen(true)
  }

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        variant: 'destructive',
        title: '请输入分组名称',
        description: '分组名称不能为空',
      })
      return
    }

    setGroupSubmitting(true)
    try {
      const response = await fetch('/api/products/attribute-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() }),
      })

      if (response.ok) {
        setNewGroupName('')
        setIsGroupDialogOpen(false)
        fetchAttributeGroups()
        toast({
          title: '添加成功',
          description: '分组已添加',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || '添加失败')
      }
    } catch (error) {
      console.error('添加分组失败:', error)
      toast({
        variant: 'destructive',
        title: '添加失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setGroupSubmitting(false)
    }
  }

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!confirm(`确定要删除分组"${groupName}"吗？`)) return

    try {
      const response = await fetch(`/api/products/attribute-groups/${groupId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAttributeGroups()
        fetchAttributes()
        // 如果删除的是当前选中的分组，清除筛选
        if (selectedGroupId === groupId) {
          setSelectedGroupId(null)
        }
        toast({
          title: '删除成功',
          description: '分组已删除',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || '删除失败')
      }
    } catch (error) {
      console.error('删除分组失败:', error)
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    }
  }

  // 处理分组筛选
  const handleGroupFilter = (groupId: number) => {
    // 如果点击的是当前选中的分组，则取消筛选
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null)
    } else {
      setSelectedGroupId(groupId)
    }
  }

  // 分组拖拽排序处理
  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = parseInt(active.id as string)
    const overId = parseInt(over.id as string)
    
    // 找到拖拽项在 attributeGroups 中的索引
    const activeIndex = attributeGroups.findIndex(g => g.id === activeId)
    const overIndex = attributeGroups.findIndex(g => g.id === overId)
    
    if (activeIndex === -1 || overIndex === -1) return
    
    // 计算新的排序顺序
    const newGroups = [...attributeGroups]
    newGroups.splice(activeIndex, 1)
    newGroups.splice(overIndex, 0, attributeGroups[activeIndex])
    
    // 更新每个分组的 sort_order 值
    const updatedGroups = newGroups.map((group, index) => ({
      ...group,
      sort_order: index
    }))
    
    // 更新本地状态（使用更新了 sort_order 的新数组）
    setAttributeGroups(updatedGroups)
    
    // 更新服务器端排序
    try {
      await Promise.all(
        updatedGroups.map((group) =>
          fetch(`/api/products/attribute-groups/${group.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: group.name,
              sortOrder: group.sort_order 
            }),
          })
        )
      )
      
      toast({
        title: '分组排序已更新',
        description: '分组顺序已保存，属性列表已同步更新',
      })
    } catch (error) {
      console.error('更新分组排序失败:', error)
      toast({
        variant: 'destructive',
        title: '更新失败',
        description: '分组排序更新失败，请重试',
      })
      // 恢复原始顺序
      fetchAttributeGroups()
    }
  }

  // 处理分组名称更新
  const handleUpdateGroupName = async (groupId: number, newName: string) => {
    if (!newName.trim()) {
      toast({
        variant: 'destructive',
        title: '请输入分组名称',
        description: '分组名称不能为空',
      })
      setEditingGroupId(null)
      setEditingGroupName('')
      return
    }

    try {
      const response = await fetch(`/api/products/attribute-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (response.ok) {
        fetchAttributeGroups()
        fetchAttributes()
        toast({
          title: '更新成功',
          description: '分组名称已更新',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || '更新失败')
      }
    } catch (error) {
      console.error('更新分组名称失败:', error)
      toast({
        variant: 'destructive',
        title: '更新失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setEditingGroupId(null)
      setEditingGroupName('')
    }
  }

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(attributes.map(a => a.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  // 切换单个选择
  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // 批量编辑
  const handleBatchEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedIds.size === 0) {
      toast({
        variant: 'destructive',
        title: '请选择属性',
        description: '请先选择要批量编辑的属性',
      })
      return
    }

    // 构建只包含启用参数的更新对象
    const updateData: any = {}
    if (batchFormData.group.enabled) updateData.group_id = batchFormData.group.value && batchFormData.group.value !== "none" ? parseInt(batchFormData.group.value) : null
    if (batchFormData.width.enabled) updateData.width = batchFormData.width.value
    if (batchFormData.columns.enabled) updateData.columns = batchFormData.columns.value
    if (batchFormData.columnWidth.enabled) updateData.column_width = batchFormData.columnWidth.value
    if (batchFormData.spacing.enabled) updateData.spacing = batchFormData.spacing.value
    if (batchFormData.rowIndex.enabled) updateData.row_index = batchFormData.rowIndex.value
    if (batchFormData.groupSortOrder.enabled) updateData.group_sort_order = batchFormData.groupSortOrder.value
    if (batchFormData.isRequired.enabled) updateData.is_required = batchFormData.isRequired.value

    const enabledCount = Object.values(batchFormData).filter((item: any) => item.enabled).length

    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/products/attributes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          })
        )
      )

      setSelectedIds(new Set())
      fetchAttributes()
      setIsBatchEditOpen(false)
      toast({
        title: '批量更新成功',
        description: `已更新 ${selectedIds.size} 个属性的 ${enabledCount} 个配置项`,
      })
    } catch (error) {
      console.error('批量更新失败:', error)
      toast({
        variant: 'destructive',
        title: '批量更新失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    }
  }

  const handleEditAttribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAttribute) return

    setSubmitting(true)
    try {
      const { group, ...bodyData } = editFormData
      const requestBody: any = { ...bodyData }
      // 正确处理 group_id：确保空字符串或 undefined 都转为 null
      if (group && group.trim() !== '') {
        const parsedId = parseInt(group, 10)
        if (!isNaN(parsedId)) {
          requestBody.group_id = parsedId
        }
      }

      const response = await fetch(`/api/products/attributes/${editingAttribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        fetchAttributes()
        setEditingAttribute(null)
        setEditFormData({ name: '', fieldCode: '', codeLength: 2, enabled: true, width: 100, columns: 1, columnWidth: 1, spacing: 2, rowIndex: 1, newRow: false, groupSortOrder: 0, isRequired: false, group: '' })
        toast({
          title: '更新成功',
          description: '属性分类已更新',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || '更新失败')
      }
    } catch (error) {
      console.error('更新属性失败:', error)
      toast({
        variant: 'destructive',
        title: '更新失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault()
    const attribute = selectedAttribute || managingAttribute
    if (!attribute) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/products/attribute-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...valueFormData,
          attributeId: attribute.id,
        }),
      })

      if (response.ok) {
        setIsValueDialogOpen(false)
        const updatedAttributes = await fetchAttributes()
        // 更新 managingAttribute 以保持弹窗数据同步
        if (managingAttribute && updatedAttributes) {
          const updated = updatedAttributes.find((a: Attribute) => a.id === managingAttribute.id)
          if (updated) {
            setManagingAttribute(updated)
          }
        }
        setValueFormData({ name: '', code: '', parentId: null })
        toast({
          title: '添加成功',
          description: '属性值已添加',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || '添加失败')
      }
    } catch (error) {
      console.error('添加属性值失败:', error)
      toast({
        variant: 'destructive',
        title: '添加失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditValue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingValue) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/products/attribute-values/${editingValue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: valueFormData.name,
          code: valueFormData.code,
        }),
      })

      if (response.ok) {
        setIsEditValueDialogOpen(false)
        const updatedAttributes = await fetchAttributes()
        // 更新 managingAttribute 以保持弹窗数据同步
        if (managingAttribute && updatedAttributes) {
          const updated = updatedAttributes.find((a: Attribute) => a.id === managingAttribute.id)
          if (updated) {
            setManagingAttribute(updated)
          }
        }
        setEditingValue(null)
        setValueFormData({ name: '', code: '', parentId: null })
        toast({
          title: '更新成功',
          description: '属性值已更新',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || '更新失败')
      }
    } catch (error) {
      console.error('更新属性值失败:', error)
      toast({
        variant: 'destructive',
        title: '更新失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAttribute = async (id: number) => {
    if (!confirm('确定要删除这个属性分类吗？删除后将无法恢复。')) return
    
    try {
      const response = await fetch(`/api/products/attributes/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setAttributes(attributes.filter(a => a.id !== id))
        toast({
          title: '删除成功',
          description: '属性分类已删除',
        })
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除属性失败:', error)
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: '请重试',
      })
    }
  }

  const handleDeleteValue = async (id: number) => {
    if (!confirm('确定要删除这个属性值吗？')) return
    
    try {
      const response = await fetch(`/api/products/attribute-values/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        const updatedAttributes = await fetchAttributes()
        // 更新 managingAttribute 以保持弹窗数据同步
        if (managingAttribute && updatedAttributes) {
          const updated = updatedAttributes.find((a: Attribute) => a.id === managingAttribute.id)
          if (updated) {
            setManagingAttribute(updated)
          }
        }
        toast({
          title: '删除成功',
          description: '属性值已删除',
        })
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除属性值失败:', error)
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: '请重试',
      })
    }
  }

  const moveValueUp = async (attributeId: number, valueIndex: number) => {
    const attribute = attributes.find(a => a.id === attributeId)
    if (!attribute || !attribute.product_attribute_values || valueIndex <= 0) return

    const values = [...attribute.product_attribute_values]
    const temp = values[valueIndex]
    values[valueIndex] = values[valueIndex - 1]
    values[valueIndex - 1] = temp

    await updateSortOrders(values)
  }

  const moveValueDown = async (attributeId: number, valueIndex: number) => {
    const attribute = attributes.find(a => a.id === attributeId)
    if (!attribute || !attribute.product_attribute_values || valueIndex >= attribute.product_attribute_values.length - 1) return

    const values = [...attribute.product_attribute_values]
    const temp = values[valueIndex]
    values[valueIndex] = values[valueIndex + 1]
    values[valueIndex + 1] = temp

    await updateSortOrders(values)
  }

  const updateSortOrders = async (values: AttributeValue[]) => {
    try {
      await Promise.all(
        values.map((value, index) =>
          fetch(`/api/products/attribute-values/${value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: value.name,
              code: value.code,
              sortOrder: index,
            }),
          })
        )
      )
      const updatedAttributes = await fetchAttributes()
      // 更新 managingAttribute 以保持弹窗数据同步
      if (managingAttribute && updatedAttributes) {
        const updated = updatedAttributes.find((a: Attribute) => a.id === managingAttribute.id)
        if (updated) {
          setManagingAttribute(updated)
        }
      }
    } catch (error) {
      console.error('更新排序失败:', error)
      toast({
        variant: 'destructive',
        title: '排序失败',
        description: '请重试',
      })
    }
  }

  // 处理属性启用/禁用
  const handleToggleAttribute = async (attribute: Attribute) => {
    try {
      const response = await fetch(`/api/products/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: attribute.name,
          code: attribute.code,
          codeLength: attribute.code_length,
          enabled: !attribute.enabled,
        }),
      })

      if (response.ok) {
        fetchAttributes()
        toast({
          title: attribute.enabled ? '已禁用' : '已启用',
          description: `属性 "${attribute.name}" ${attribute.enabled ? '已禁用' : '已启用'}`,
        })
      } else {
        throw new Error('操作失败')
      }
    } catch (error) {
      console.error('切换启用状态失败:', error)
      toast({
        variant: 'destructive',
        title: '操作失败',
        description: '请重试',
      })
    }
  }

  // 处理属性必选/可选切换
  const handleToggleRequired = async (attribute: Attribute) => {
    try {
      const response = await fetch(`/api/products/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: attribute.name,
          code: attribute.code,
          codeLength: attribute.code_length,
          isRequired: !attribute.is_required,
        }),
      })

      if (response.ok) {
        fetchAttributes()
        toast({
          title: attribute.is_required ? '已设为可选' : '已设为必选',
          description: `属性 "${attribute.name}" ${attribute.is_required ? '已设为可选' : '已设为必选'}`,
        })
      } else {
        throw new Error('操作失败')
      }
    } catch (error) {
      console.error('切换必选状态失败:', error)
      toast({
        variant: 'destructive',
        title: '操作失败',
        description: '请重试',
      })
    }
  }

  // 处理属性新行切换
  const handleToggleNewRow = async (attribute: Attribute) => {
    try {
      const response = await fetch(`/api/products/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: attribute.name,
          code: attribute.code,
          codeLength: attribute.code_length,
          newRow: !attribute.new_row,
        }),
      })

      if (response.ok) {
        fetchAttributes()
        toast({
          title: attribute.new_row ? '已取消新行' : '已设为新行',
          description: `属性 "${attribute.name}" ${attribute.new_row ? '已取消新行' : '已设为新行'}`,
        })
      } else {
        throw new Error('操作失败')
      }
    } catch (error) {
      console.error('切换新行状态失败:', error)
      toast({
        variant: 'destructive',
        title: '操作失败',
        description: '请重试',
      })
    }
  }

  // 属性上移
  const moveAttributeUp = async (index: number) => {
    if (index <= 0) return

    const newAttributes = [...attributes]
    const temp = newAttributes[index]
    newAttributes[index] = newAttributes[index - 1]
    newAttributes[index - 1] = temp

    await updateAttributeSortOrders(newAttributes)
  }

  // 属性下移
  const moveAttributeDown = async (index: number) => {
    if (index >= attributes.length - 1) return

    const newAttributes = [...attributes]
    const temp = newAttributes[index]
    newAttributes[index] = newAttributes[index + 1]
    newAttributes[index + 1] = temp

    await updateAttributeSortOrders(newAttributes)
  }

  // 更新属性排序
  const updateAttributeSortOrders = async (newAttributes: Attribute[]) => {
    try {
      await Promise.all(
        newAttributes.map((attr, index) =>
          fetch(`/api/products/attributes/${attr.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: attr.name,
              code: attr.code,
              codeLength: attr.code_length,
              enabled: attr.enabled,
              sortOrder: index,
            }),
          })
        )
      )
      fetchAttributes()
    } catch (error) {
      console.error('更新属性排序失败:', error)
      toast({
        variant: 'destructive',
        title: '排序失败',
        description: '请重试',
      })
    }
  }

  const openEditDialog = (attribute: Attribute, value: AttributeValue) => {
    setManagingAttribute(attribute)
    setEditingValue(value)
    setValueFormData({
      name: value.name,
      code: value.code,
      parentId: value.parent_id,
    })
    setIsEditValueDialogOpen(true)
  }

  const openAttributeEditDialog = (attribute: Attribute) => {
    setEditingAttribute(attribute)
    setEditFormData({
      name: attribute.name,
      fieldCode: attribute.field_code || '',
      codeLength: attribute.code_length,
      enabled: attribute.enabled !== undefined ? attribute.enabled : true,
      // Layout configuration
      width: attribute.width || 100,
      columns: attribute.columns || 1,
      columnWidth: attribute.column_width || 1,
      spacing: attribute.spacing || 2,
      rowIndex: attribute.row_index || 1,
      newRow: attribute.new_row || false,
      groupSortOrder: attribute.group_sort_order || 0,
      isRequired: attribute.is_required || false,
      group: attribute.group_id ? String(attribute.group_id) : '',
    })
    setIsEditDialogOpen(true)
  }

  // 使用 useMemo 缓存 filteredAttributes，避免每次渲染都创建新引用
  const filteredAttributes = useMemo(() => {
    return attributes.filter(attribute => {
      // 分组筛选
      if (selectedGroupId !== null) {
        if (attribute.group_id !== selectedGroupId) return false
      }
      // 搜索筛选
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        attribute.name.toLowerCase().includes(query) ||
        attribute.code.toLowerCase().includes(query)
      )
    })
  }, [attributes, selectedGroupId, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ padding: 'var(--page-padding)' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--section-gap)' }}>
        <h1 className="text-2xl font-medium text-gray-900 mb-1">商品属性管理</h1>
        <p className="text-sm text-gray-400">配置商品属性分类，如品牌、年份、季节等</p>
      </div>

      {/* 分组管理 */}
      <div 
        className="mb-6 bg-gray-50"
        style={{ 
          padding: 'var(--card-padding)',
          borderRadius: 'var(--card-radius)',
          borderWidth: 'var(--card-border-width)',
          borderColor: 'var(--border-color)',
          borderStyle: 'solid'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">分组管理</h3>
          <Dialog open={isGroupDialogOpen} onOpenChange={(open) => {
            setIsGroupDialogOpen(open)
            if (!open) setNewGroupName('')
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加分组
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-hidden p-0">
              <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100">
                <DialogTitle className="text-sm font-medium text-gray-900">添加分组</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col max-h-[calc(80vh-100px)]">
                <div className="flex-1 overflow-y-auto px-4 py-2">
                  <div>
                    <Label htmlFor="groupName" className="text-xs text-gray-500 mb-1 block">分组名称</Label>
                    <Input
                      id="groupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="例如：基础信息"
                      className="h-8 text-xs bg-white border-gray-200 w-full"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsGroupDialogOpen(false)} className="h-7 text-xs">
                    取消
                  </Button>
                  <Button type="button" size="sm" onClick={handleAddGroup} disabled={groupSubmitting} className="h-7 text-xs bg-blue-500 hover:bg-blue-600">
                    {groupSubmitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    添加
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {attributeGroups.length === 0 ? (
          <p className="text-sm text-gray-400">暂无分组，点击上方按钮添加</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGroupDragEnd}
          >
            <SortableContext
              items={attributeGroups.map(g => g.id.toString())}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex flex-wrap gap-2">
                {attributeGroups.map((group) => (
                  <SortableGroupItem
                    key={group.id}
                    group={group}
                    isSelected={selectedGroupId === group.id}
                    isEditing={editingGroupId === group.id}
                    editingName={editingGroupName}
                    onSelect={() => handleGroupFilter(group.id)}
                    onEdit={() => {
                      setEditingGroupId(group.id)
                      setEditingGroupName(group.name)
                    }}
                    onDelete={() => handleDeleteGroup(group.id, group.name)}
                    onEditChange={setEditingGroupName}
                    onEditSubmit={() => handleUpdateGroupName(group.id, editingGroupName)}
                    onEditCancel={() => {
                      setEditingGroupId(null)
                      setEditingGroupName('')
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        {selectedGroupId !== null && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              已筛选分组：
              <span className="font-medium text-gray-700">
                {attributeGroups.find(g => g.id === selectedGroupId)?.name}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
              onClick={() => setSelectedGroupId(null)}
            >
              清除筛选
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center gap-4">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索属性名称或编码..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* 批量编辑按钮 */}
        <Dialog open={isBatchEditOpen} onOpenChange={(open) => {
          setIsBatchEditOpen(open)
          if (!open) {
            setBatchFormData({
              group: { value: '', enabled: false },
              width: { value: 100, enabled: false },
              columns: { value: 1, enabled: false },
              columnWidth: { value: 1, enabled: false },
              spacing: { value: 2, enabled: false },
              rowIndex: { value: 1, enabled: false },
              groupSortOrder: { value: 0, enabled: false },
              isRequired: { value: false, enabled: false },
            })
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={selectedIds.size === 0}>
              <Settings2 className="h-4 w-4 mr-2" />
              批量编辑 ({selectedIds.size})
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-medium">批量编辑布局配置</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBatchEdit}>
              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-600">
                  已选择 <span className="font-medium">{selectedIds.size}</span> 个属性
                </p>
                <p className="text-xs text-gray-400">
                  勾选需要修改的配置项，仅勾选的配置项会被更新
                </p>
                {/* 分组 */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="batchGroup"
                    checked={batchFormData.group.enabled}
                    onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, group: { ...batchFormData.group, enabled: checked as boolean } })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="batchGroup">分组</Label>
                    <Select
                      value={batchFormData.group.value || "none"}
                      onValueChange={(value) => setBatchFormData({ ...batchFormData, group: { ...batchFormData.group, value: value === "none" ? "" : value } })}
                      disabled={!batchFormData.group.enabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择分组" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">无分组</SelectItem>
                        {attributeGroups.map((group) => (
                          <SelectItem key={group.id} value={String(group.id)}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* 宽度 */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="batchWidth"
                    checked={batchFormData.width.enabled}
                    onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, width: { ...batchFormData.width, enabled: checked as boolean } })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="batchWidth">宽度 (%)</Label>
                    <Input
                      type="number"
                      value={batchFormData.width.value}
                      onChange={(e) => setBatchFormData({ ...batchFormData, width: { ...batchFormData.width, value: parseInt(e.target.value) } })}
                      disabled={!batchFormData.width.enabled}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
                {/* 列数 */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="batchColumns"
                    checked={batchFormData.columns.enabled}
                    onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, columns: { ...batchFormData.columns, enabled: checked as boolean } })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="batchColumns">列数</Label>
                    <Input
                      type="number"
                      value={batchFormData.columns.value}
                      onChange={(e) => setBatchFormData({ ...batchFormData, columns: { ...batchFormData.columns, value: parseInt(e.target.value) } })}
                      disabled={!batchFormData.columns.enabled}
                      min="1"
                      max="12"
                    />
                  </div>
                </div>
                {/* 列宽 */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="batchColumnWidth"
                    checked={batchFormData.columnWidth.enabled}
                    onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, columnWidth: { ...batchFormData.columnWidth, enabled: checked as boolean } })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="batchColumnWidth">列宽</Label>
                    <Input
                      type="number"
                      value={batchFormData.columnWidth.value}
                      onChange={(e) => setBatchFormData({ ...batchFormData, columnWidth: { ...batchFormData.columnWidth, value: parseInt(e.target.value) } })}
                      disabled={!batchFormData.columnWidth.enabled}
                      min="1"
                      max="12"
                    />
                  </div>
                </div>
                {/* 间距 */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="batchSpacing"
                    checked={batchFormData.spacing.enabled}
                    onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, spacing: { ...batchFormData.spacing, enabled: checked as boolean } })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="batchSpacing">间距</Label>
                    <Input
                      type="number"
                      value={batchFormData.spacing.value}
                      onChange={(e) => setBatchFormData({ ...batchFormData, spacing: { ...batchFormData.spacing, value: parseInt(e.target.value) } })}
                      disabled={!batchFormData.spacing.enabled}
                      min="0"
                      max="5"
                    />
                  </div>
                </div>
                {/* 行号 */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="batchRowIndex"
                    checked={batchFormData.rowIndex.enabled}
                    onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, rowIndex: { ...batchFormData.rowIndex, enabled: checked as boolean } })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="batchRowIndex">行号</Label>
                    <Input
                      type="number"
                      value={batchFormData.rowIndex.value}
                      onChange={(e) => setBatchFormData({ ...batchFormData, rowIndex: { ...batchFormData.rowIndex, value: parseInt(e.target.value) } })}
                      disabled={!batchFormData.rowIndex.enabled}
                      min="1"
                    />
                  </div>
                </div>
                {/* 分组内排序 */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="batchGroupSortOrder"
                    checked={batchFormData.groupSortOrder.enabled}
                    onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, groupSortOrder: { ...batchFormData.groupSortOrder, enabled: checked as boolean } })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="batchGroupSortOrder">分组内排序</Label>
                    <Input
                      type="number"
                      value={batchFormData.groupSortOrder.value}
                      onChange={(e) => setBatchFormData({ ...batchFormData, groupSortOrder: { ...batchFormData.groupSortOrder, value: parseInt(e.target.value) } })}
                      disabled={!batchFormData.groupSortOrder.enabled}
                      min="0"
                    />
                  </div>
                </div>
                {/* 必选 */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="batchIsRequired"
                    checked={batchFormData.isRequired.enabled}
                    onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, isRequired: { ...batchFormData.isRequired, enabled: checked as boolean } })}
                  />
                  <div className="flex-1">
                    <Label htmlFor="batchIsRequired">必选</Label>
                    <Switch
                      checked={batchFormData.isRequired.value}
                      onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, isRequired: { ...batchFormData.isRequired, value: checked as boolean } })}
                      disabled={!batchFormData.isRequired.enabled}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsBatchEditOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  保存
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 列设置按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={handleOpenColumnSettings}>
              <Settings2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>列设置</p>
          </TooltipContent>
        </Tooltip>

        <Dialog open={isColumnSettingsOpen} onOpenChange={setIsColumnSettingsOpen}>
          <DialogContent className="max-w-3xl w-[90vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base">列设置</DialogTitle>
                <Button variant="outline" size="sm" onClick={handleResetColumnSettings} className="h-7 text-xs">
                  重置默认
                </Button>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto">
              {/* 列配置列表 */}
              <div className="px-4 py-3">
                <div className="text-xs font-medium text-gray-700 mb-2">列配置（拖动调整顺序）</div>
                
                <div className="space-y-1">
                  {tempColumnOrder.map((colKey, index) => {
                    const col = defaultColumns.find(c => c.key === colKey)
                    const setting = tempColumnSettings.find(s => s.key === colKey)
                    if (!col || !setting) return null
                    
                    const isFixed = colKey === 'checkbox' || colKey === 'actions' // 固定列不可隐藏

                    return (
                      <div
                        key={colKey}
                        className={`flex items-center gap-2 px-3 py-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors ${isFixed ? 'bg-gray-50' : 'bg-white'}`}
                      >
                        {/* 排序按钮 */}
                        <div className="flex items-center gap-0.5 w-10">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-700"
                            onClick={() => handleMoveColumnUp(colKey)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-700"
                            onClick={() => handleMoveColumnDown(colKey)}
                            disabled={index === tempColumnOrder.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* 显示/隐藏 */}
                        <div className="flex items-center gap-1.5 w-12">
                          <Checkbox
                            checked={setting.visible}
                            onCheckedChange={() => handleToggleColumnVisible(colKey)}
                            disabled={isFixed}
                          />
                          <Label className="text-[10px] text-gray-500">显示</Label>
                        </div>

                        {/* 冻结 */}
                        <div className="flex items-center gap-1.5 w-12">
                          {col.freezable && (
                            <>
                              <Checkbox
                                checked={setting.frozen}
                                onCheckedChange={() => handleToggleColumnFrozen(colKey)}
                                disabled={!setting.visible}
                              />
                              <Label className="text-[10px] text-gray-500">冻结</Label>
                            </>
                          )}
                        </div>

                        {/* 列名 */}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium">{col.label || '-'}</span>
                          <span className="text-[10px] text-gray-400 ml-1.5">{colKey}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 pb-3 px-4 border-t flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleCancelColumnSettings} className="h-8">
                取消
              </Button>
              <Button size="sm" onClick={handleSaveColumnSettings} className="h-8">
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 添加按钮 */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setFormData({ name: '', fieldCode: '', codeLength: 2, enabled: true, isRequired: false, group: '', width: 100, columns: 1, columnWidth: 1, spacing: 2, rowIndex: 1, newRow: false, groupSortOrder: 0 })
        }}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              添加属性分类
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-hidden p-0">
            <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100">
              <DialogTitle className="text-sm font-medium text-gray-900">添加属性分类</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAttribute} className="flex flex-col max-h-[calc(80vh-100px)]">
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                {/* 基本信息 */}
                <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <Type className="h-3.5 w-3.5" />
                    基本信息
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="name" className="text-xs text-gray-500 mb-1 block">属性名称</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          const newName = e.target.value
                          const newFieldCode = generateFieldCode(newName)
                          setFormData({ ...formData, name: newName, fieldCode: newFieldCode })
                        }}
                        placeholder="例如：品牌"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fieldCode" className="text-xs text-gray-500 mb-1 block">数据库字段名</Label>
                      <Input
                        id="fieldCode"
                        value={formData.fieldCode}
                        onChange={(e) => setFormData({ ...formData, fieldCode: e.target.value })}
                        placeholder="自动生成"
                        className="h-8 text-xs bg-gray-100 border-gray-200 w-full text-gray-600"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="codeLength" className="text-xs text-gray-500 mb-1 block">编码位数</Label>
                      <Input
                        id="codeLength"
                        type="number"
                        value={formData.codeLength}
                        onChange={(e) => setFormData({ ...formData, codeLength: parseInt(e.target.value) })}
                        min="1"
                        max="10"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="group" className="text-xs text-gray-500 mb-1 block">分组</Label>
                      <Select
                        value={formData.group || "none"}
                        onValueChange={(value) => setFormData({ ...formData, group: value === "none" ? "" : value })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full">
                          <SelectValue placeholder="选择分组" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">无分组</SelectItem>
                          {attributeGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()} className="text-xs">
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        id="isRequired"
                        checked={formData.isRequired}
                        onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                        className="data-[state=checked]:bg-red-500"
                      />
                      <span className="text-xs text-gray-600">必填字段</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        id="enabled"
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <span className="text-xs text-gray-600">启用字段</span>
                    </label>
                  </div>
                </div>

                {/* 布局配置 */}
                <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    布局配置
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label htmlFor="width" className="text-xs text-gray-500 mb-1 block">宽度 (%)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={formData.width}
                        onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) })}
                        min="1"
                        max="100"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="columns" className="text-xs text-gray-500 mb-1 block">列数</Label>
                      <Input
                        id="columns"
                        type="number"
                        value={formData.columns}
                        onChange={(e) => setFormData({ ...formData, columns: parseInt(e.target.value) })}
                        min="1"
                        max="12"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="columnWidth" className="text-xs text-gray-500 mb-1 block">列宽</Label>
                      <Input
                        id="columnWidth"
                        type="number"
                        value={formData.columnWidth}
                        onChange={(e) => setFormData({ ...formData, columnWidth: parseInt(e.target.value) })}
                        min="1"
                        max="12"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="spacing" className="text-xs text-gray-500 mb-1 block">间距</Label>
                      <Input
                        id="spacing"
                        type="number"
                        value={formData.spacing}
                        onChange={(e) => setFormData({ ...formData, spacing: parseInt(e.target.value) })}
                        min="0"
                        max="5"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="rowIndex" className="text-xs text-gray-500 mb-1 block">行号</Label>
                      <Input
                        id="rowIndex"
                        type="number"
                        value={formData.rowIndex}
                        onChange={(e) => setFormData({ ...formData, rowIndex: parseInt(e.target.value) })}
                        min="1"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="groupSortOrder" className="text-xs text-gray-500 mb-1 block">分组内排序</Label>
                      <Input
                        id="groupSortOrder"
                        type="number"
                        value={formData.groupSortOrder}
                        onChange={(e) => setFormData({ ...formData, groupSortOrder: parseInt(e.target.value) })}
                        min="0"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-0.5 border-t border-gray-200/50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        id="newRow"
                        checked={formData.newRow}
                        onCheckedChange={(checked) => setFormData({ ...formData, newRow: checked })}
                        className="data-[state=checked]:bg-blue-500"
                      />
                      <span className="text-xs text-gray-600">新行</span>
                    </label>
                    <span className="text-[10px] text-gray-400">开启后，该属性单独占据一行</span>
                  </div>
                </div>
              </div>
              
              {/* 底部按钮 */}
              <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)} className="h-8 text-xs">
                  取消
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-blue-500 hover:bg-blue-600">
                  {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  保存
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Attributes Table */}
      <div 
        className="bg-white overflow-hidden w-full"
        style={{ 
          borderRadius: 'var(--card-radius)',
          borderWidth: 'var(--card-border-width)',
          borderColor: 'var(--border-color)',
          borderStyle: 'solid'
        }}
      >
        {/* 使用提示 */}
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex items-center gap-2">
          <Settings2 className="h-3 w-3" />
          <span>
            <strong>提示：</strong>点击"列设置"可显示/隐藏列、冻结列
          </span>
        </div>

        {/* 表格内容 - 操作列固定布局 */}
        <div className="border border-gray-200 rounded-lg flex">
          {/* 左侧滚动区域 */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex flex-col min-w-full">
            {/* 表头 */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleColumnDragEnd}
            >
              <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                <div className="flex bg-gray-50 border-b border-gray-200 text-xs font-medium h-10">
                  {columnOrder.map((colKey) => {
                    const column = defaultColumns.find(c => c.key === colKey)
                    const setting = columnSettings.find(s => s.key === colKey)
                    if (!column || !setting?.visible) return null
                    // 跳过操作列，在固定区域单独渲染
                    if (colKey === 'actions') return null

                    return (
                      <SortableHeaderCell
                        key={colKey}
                        id={colKey}
                        flex={column.flex}
                        width={column.width}
                        isSelected={selectedColumn === colKey}
                        onSelect={setSelectedColumn}
                        isCheckbox={column.key === 'checkbox'}
                      >
                        {colKey === 'checkbox' && attributes.length > 0 && (
                          <Checkbox
                            checked={selectedIds.size === attributes.length && selectedIds.size > 0}
                            onCheckedChange={handleSelectAll}
                            className="m-0"
                          />
                        )}
                        {colKey === 'index' && <span>序号</span>}
                        {colKey === 'drag' && <span>排序</span>}
                        {colKey === 'group' && <span>分组</span>}
                        {colKey === 'name' && <span>属性名称</span>}
                        {colKey === 'code' && <span>数据库字段名</span>}
                        {colKey === 'valueCount' && <span>子属性数</span>}
                        {colKey === 'codeLength' && <span>子属性代码</span>}
                        {colKey === 'rowIndex' && <span>行号</span>}
                        {colKey === 'columns' && <span>列数</span>}
                        {colKey === 'columnWidth' && <span>列宽</span>}
                        {colKey === 'width' && <span>宽度</span>}
                        {colKey === 'spacing' && <span>间距</span>}
                        {colKey === 'newRow' && <span>新行</span>}
                        {colKey === 'isRequired' && <span>必选</span>}
                        {colKey === 'enabled' && <span>启用</span>}
                      </SortableHeaderCell>
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>

        {/* 数据行 */}
        {attributes.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm text-gray-400">暂无属性配置，点击上方按钮添加</p>
          </div>
        ) : filteredAttributes.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm text-gray-400 mb-3">未找到匹配的属性</p>
            <Button variant="ghost" onClick={() => setSearchQuery('')}>
              清除搜索
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAttributes.map((attribute, index) => (
              <div key={attribute.id} className="group flex items-center hover:bg-gray-50 transition-colors h-11">
                {columnOrder.map((colKey) => {
                    const column = defaultColumns.find(c => c.key === colKey)
                    const setting = columnSettings.find(s => s.key === colKey)
                    if (!column || !setting?.visible) return null
                    // 跳过操作列，在固定区域单独渲染
                    if (colKey === 'actions') return null

                    // flex 为 0 表示固定宽度，否则使用 flex 比例 + 最小宽度
                    const cellStyle: React.CSSProperties = column.flex === 0 && column.width
                      ? { width: `${column.width}px`, flexShrink: 0 }
                      : { flex: column.flex, minWidth: '60px' }

                    return (
                      <div
                        key={colKey}
                        className={`flex items-center justify-center whitespace-nowrap ${colKey === 'checkbox' ? 'pl-4 pr-2' : 'px-3'}`}
                        style={cellStyle}
                      >
                        {colKey === 'checkbox' && (
                          <Checkbox
                            checked={selectedIds.has(attribute.id)}
                            onCheckedChange={() => handleToggleSelect(attribute.id)}
                            className="m-0"
                          />
                        )}
                        {colKey === 'drag' && (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                              onClick={() => moveAttributeUp(index)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                              onClick={() => moveAttributeDown(index)}
                              disabled={index >= attributes.length - 1}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                        {colKey === 'index' && (
                          <span className="text-sm text-gray-600">{index + 1}</span>
                        )}
                        {colKey === 'group' && (
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {attribute.product_attribute_groups?.name || attributeGroups.find((g: AttributeGroup) => g.id === attribute.group_id)?.name || '-'}
                          </span>
                        )}
                        {colKey === 'name' && (
                          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{attribute.name}</span>
                        )}
                        {colKey === 'code' && (
                          <span className="text-sm text-gray-600 font-mono whitespace-nowrap">{attribute.field_code || '-'}</span>
                        )}
                        {colKey === 'codeLength' && (
                          <span className="text-sm text-gray-600">{attribute.code_length} 位</span>
                        )}
                        {colKey === 'valueCount' && (
                          <span className="text-sm text-gray-600">{attribute.product_attribute_values?.length || 0}</span>
                        )}
                        {colKey === 'width' && (
                          <span className="text-sm text-gray-600">{attribute.width}%</span>
                        )}
                        {colKey === 'columns' && (
                          <span className="text-sm text-gray-600">{attribute.columns}</span>
                        )}
                        {colKey === 'columnWidth' && (
                          <span className="text-sm text-gray-600">{attribute.column_width}</span>
                        )}
                        {colKey === 'spacing' && (
                          <span className="text-sm text-gray-600">{attribute.spacing}</span>
                        )}
                        {colKey === 'rowIndex' && (
                          <span className="text-sm text-gray-600">{attribute.row_index}</span>
                        )}
                        {colKey === 'isRequired' && (
                          <Switch
                            checked={attribute.is_required}
                            onCheckedChange={() => handleToggleRequired(attribute)}
                            className="data-[state=checked]:bg-orange-600"
                          />
                        )}
                        {colKey === 'enabled' && (
                          <Switch
                            checked={attribute.enabled}
                            onCheckedChange={() => handleToggleAttribute(attribute)}
                            className="data-[state=checked]:bg-green-600"
                          />
                        )}
                        {colKey === 'newRow' && (
                          <Switch
                            checked={attribute.new_row}
                            onCheckedChange={() => handleToggleNewRow(attribute)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        )}
                        {colKey === 'sort' && (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
                              onClick={() => moveAttributeUp(index)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
                              onClick={() => moveAttributeDown(index)}
                              disabled={index >= attributes.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        )}
            </div>
          </div>
          
          {/* 右侧固定操作列 */}
          <div className="flex flex-col border-l border-gray-200 bg-white" style={{ minWidth: '180px', flexShrink: 0 }}>
            {/* 操作列表头 */}
            <div className="flex items-center justify-center bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 h-10">
              操作
            </div>
            {/* 操作列数据 */}
            {attributes.length > 0 && filteredAttributes.length > 0 && (
              <div className="divide-y divide-gray-100">
                {filteredAttributes.map((attribute, index) => (
                  <div key={attribute.id} className="group flex items-center hover:bg-gray-50 transition-colors h-11">
                    <div className="flex items-center gap-1 px-2 w-full justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => openAttributeEditDialog(attribute)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        编辑
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => {
                          setManagingAttribute(attribute)
                          setIsManageValuesDialogOpen(true)
                        }}
                      >
                        <List className="h-3.5 w-3.5 mr-1" />
                        管理
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteAttribute(attribute.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 属性值管理弹窗 */}
      <Dialog open={isManageValuesDialogOpen} onOpenChange={(open) => {
        setIsManageValuesDialogOpen(open)
        if (!open) {
          setManagingAttribute(null)
          setValueFormData({ name: '', code: '', parentId: null })
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100">
            <DialogTitle className="text-sm font-medium text-gray-900">
              管理子字段 - {managingAttribute?.name}
            </DialogTitle>
          </DialogHeader>
          {/* 工具栏 */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">
              共 {managingAttribute?.product_attribute_values?.length || 0} 个子字段
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSelectedAttribute(managingAttribute)
                setIsValueDialogOpen(true)
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              添加值
            </Button>
          </div>
          <div className="flex flex-col max-h-[calc(80vh-140px)]">
            <div className="flex-1 overflow-y-auto">
              {managingAttribute && (
                <AttributeValueList
                  attribute={managingAttribute}
                  onEdit={(value) => {
                    setEditingValue(value)
                    setIsEditValueDialogOpen(true)
                  }}
                  onDelete={handleDeleteValue}
                  onMoveUp={moveValueUp}
                  onMoveDown={moveValueDown}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加属性值弹窗 */}
      <Dialog open={isValueDialogOpen} onOpenChange={(open) => {
        setIsValueDialogOpen(open)
        if (!open) {
          setSelectedAttribute(null)
          setValueFormData({ name: '', code: '', parentId: null })
        }
      }}>
        <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100">
            <DialogTitle className="text-sm font-medium text-gray-900">添加属性值 - {selectedAttribute?.name || managingAttribute?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddValue} className="flex flex-col max-h-[calc(80vh-100px)]">
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              <div>
                <Label htmlFor="valueName" className="text-xs text-gray-500 mb-1 block">值名称</Label>
                <Input
                  id="valueName"
                  value={valueFormData.name}
                  onChange={(e) => setValueFormData({ ...valueFormData, name: e.target.value })}
                  placeholder="例如：培蒙"
                  className="h-8 text-xs bg-white border-gray-200 w-full"
                  required
                />
              </div>
              <div>
                <Label htmlFor="valueCode" className="text-xs text-gray-500 mb-1 block">值代码 (最多 {(selectedAttribute || managingAttribute)?.code_length} 位)</Label>
                <Input
                  id="valueCode"
                  value={valueFormData.code}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    const maxLen = (selectedAttribute || managingAttribute)?.code_length || 2
                    if (value.length <= maxLen) {
                      setValueFormData({ ...valueFormData, code: value })
                    }
                  }}
                  placeholder="例如：PM"
                  maxLength={(selectedAttribute || managingAttribute)?.code_length}
                  className="h-8 text-xs bg-white border-gray-200 w-full"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  已输入 {valueFormData.code.length} / {(selectedAttribute || managingAttribute)?.code_length || 2} 位
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsValueDialogOpen(false)} className="h-8 text-xs">
                取消
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-blue-500 hover:bg-blue-600">
                {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑属性分类对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setEditingAttribute(null)
          setEditFormData({ name: '', fieldCode: '', codeLength: 2, enabled: true, width: 100, columns: 1, columnWidth: 1, spacing: 2, rowIndex: 1, newRow: false, groupSortOrder: 0, isRequired: false, group: '' })
        }
      }}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100">
            <DialogTitle className="text-sm font-medium text-gray-900">编辑属性分类</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAttribute} className="flex flex-col max-h-[calc(80vh-100px)]">
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {/* 基本信息 */}
              <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <Type className="h-3.5 w-3.5" />
                  基本信息
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="editName" className="text-xs text-gray-500 mb-1 block">属性名称</Label>
                    <Input
                      id="editName"
                      value={editFormData.name}
                      onChange={(e) => {
                        const newName = e.target.value
                        const newFieldCode = generateFieldCode(newName)
                        setEditFormData({ ...editFormData, name: newName, fieldCode: newFieldCode })
                      }}
                      placeholder="例如：品牌"
                      className="h-8 text-xs bg-white border-gray-200 w-full"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editFieldCode" className="text-xs text-gray-500 mb-1 block">数据库字段名</Label>
                    <Input
                      id="editFieldCode"
                      value={editFormData.fieldCode}
                      onChange={(e) => setEditFormData({ ...editFormData, fieldCode: e.target.value })}
                      placeholder="自动生成"
                      className="h-8 text-xs bg-gray-100 border-gray-200 w-full text-gray-600"
                      readOnly
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="editCodeLength" className="text-xs text-gray-500 mb-1 block">编码位数</Label>
                    <Input
                      id="editCodeLength"
                      type="number"
                      value={editFormData.codeLength}
                      onChange={(e) => setEditFormData({ ...editFormData, codeLength: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                      className="h-8 text-xs bg-white border-gray-200 w-full"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editGroup" className="text-xs text-gray-500 mb-1 block">分组</Label>
                    <Select
                      value={editFormData.group || "none"}
                      onValueChange={(value) => setEditFormData({ ...editFormData, group: value === "none" ? "" : value })}
                    >
                      <SelectTrigger id="editGroup" className="h-8 text-xs bg-white border-gray-200 w-full">
                        <SelectValue placeholder="选择分组" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">无分组</SelectItem>
                        {attributeGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()} className="text-xs">
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      id="editIsRequired"
                      checked={editFormData.isRequired}
                      onCheckedChange={(checked) => setEditFormData({ ...editFormData, isRequired: checked })}
                      className="data-[state=checked]:bg-red-500"
                    />
                    <span className="text-xs text-gray-600">必填字段</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      id="editEnabled"
                      checked={editFormData.enabled}
                      onCheckedChange={(checked) => setEditFormData({ ...editFormData, enabled: checked })}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <span className="text-xs text-gray-600">启用字段</span>
                  </label>
                </div>
              </div>

              {/* 布局配置 */}
              <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  布局配置
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="editWidth" className="text-xs text-gray-500 mb-1 block">宽度 (%)</Label>
                    <Input
                      id="editWidth"
                      type="number"
                      value={editFormData.width}
                      onChange={(e) => setEditFormData({ ...editFormData, width: parseInt(e.target.value) })}
                      min="1"
                      max="100"
                      className="h-8 text-xs bg-white border-gray-200 w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editColumns" className="text-xs text-gray-500 mb-1 block">列数</Label>
                    <Input
                      id="editColumns"
                      type="number"
                      value={editFormData.columns}
                      onChange={(e) => setEditFormData({ ...editFormData, columns: parseInt(e.target.value) })}
                      min="1"
                      max="12"
                      className="h-8 text-xs bg-white border-gray-200 w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editColumnWidth" className="text-xs text-gray-500 mb-1 block">列宽</Label>
                    <Input
                      id="editColumnWidth"
                      type="number"
                      value={editFormData.columnWidth}
                      onChange={(e) => setEditFormData({ ...editFormData, columnWidth: parseInt(e.target.value) })}
                      min="1"
                      max="12"
                      className="h-8 text-xs bg-white border-gray-200 w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editSpacing" className="text-xs text-gray-500 mb-1 block">间距</Label>
                    <Input
                      id="editSpacing"
                      type="number"
                      value={editFormData.spacing}
                      onChange={(e) => setEditFormData({ ...editFormData, spacing: parseInt(e.target.value) })}
                      min="0"
                      max="5"
                      className="h-8 text-xs bg-white border-gray-200 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="editRowIndex" className="text-xs text-gray-500 mb-1 block">行号</Label>
                    <Input
                      id="editRowIndex"
                      type="number"
                      value={editFormData.rowIndex}
                      onChange={(e) => setEditFormData({ ...editFormData, rowIndex: parseInt(e.target.value) })}
                      min="1"
                      className="h-8 text-xs bg-white border-gray-200 w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editGroupSortOrder" className="text-xs text-gray-500 mb-1 block">分组内排序</Label>
                    <Input
                      id="editGroupSortOrder"
                      type="number"
                      value={editFormData.groupSortOrder}
                      onChange={(e) => setEditFormData({ ...editFormData, groupSortOrder: parseInt(e.target.value) })}
                      min="0"
                      className="h-8 text-xs bg-white border-gray-200 w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-0.5 border-t border-gray-200/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      id="editNewRow"
                      checked={editFormData.newRow}
                      onCheckedChange={(checked) => setEditFormData({ ...editFormData, newRow: checked })}
                      className="data-[state=checked]:bg-blue-500"
                    />
                    <span className="text-xs text-gray-600">新行</span>
                  </label>
                  <span className="text-[10px] text-gray-400">开启后，该属性单独占据一行</span>
                </div>
              </div>
            </div>
            
            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditDialogOpen(false)} className="h-8 text-xs">
                取消
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-blue-500 hover:bg-blue-600">
                {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑属性值对话框 */}
      <Dialog open={isEditValueDialogOpen} onOpenChange={(open) => {
        setIsEditValueDialogOpen(open)
        if (!open) {
          setEditingValue(null)
          setValueFormData({ name: '', code: '', parentId: null })
        }
      }}>
        <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100">
            <DialogTitle className="text-sm font-medium text-gray-900">编辑属性值 - {managingAttribute?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditValue} className="flex flex-col max-h-[calc(80vh-100px)]">
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              <div>
                <Label htmlFor="editValueName" className="text-xs text-gray-500 mb-1 block">值名称</Label>
                <Input
                  id="editValueName"
                  value={valueFormData.name}
                  onChange={(e) => setValueFormData({ ...valueFormData, name: e.target.value })}
                  placeholder="例如：培蒙"
                  className="h-8 text-xs bg-white border-gray-200 w-full"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editValueCode" className="text-xs text-gray-500 mb-1 block">值代码 (最多 {managingAttribute?.code_length} 位)</Label>
                <Input
                  id="editValueCode"
                  value={valueFormData.code}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    const maxLen = managingAttribute?.code_length || 2
                    if (value.length <= maxLen) {
                      setValueFormData({ ...valueFormData, code: value })
                    }
                  }}
                  placeholder="例如：PM"
                  maxLength={managingAttribute?.code_length}
                  className="h-8 text-xs bg-white border-gray-200 w-full"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  已输入 {valueFormData.code.length} / {managingAttribute?.code_length || 2} 位
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditValueDialogOpen(false)} className="h-8 text-xs">
                取消
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-blue-500 hover:bg-blue-600">
                {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
