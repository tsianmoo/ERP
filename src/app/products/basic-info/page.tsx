'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Loader2, Search, Settings2, GripHorizontal, Type, List, Maximize2, Move, Hash, Zap, LayoutGrid, Play, GripVertical, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BasicField {
  id: number
  field_name: string
  display_name: string  // 扩展名称（显示名称）
  field_code: string  // 数据库字段名，用于标识货号等特殊字段
  field_type: string
  is_required: boolean
  options: any
  default_value: string | null  // 默认值（布尔值: 'true'/'false', 单选: option value）
  sort_order: number
  enabled: boolean
  group_name: string | null
  group_id: number | null
  auto_generate: boolean  // 是否自动生成
  code_rule_id: number | null  // 关联的编码规则ID
  field_group: {
    id: number
    name: string
  } | null
  // Layout configuration
  width: number
  columns: number
  column_width: number
  spacing: number
  row_index: number
  new_row: boolean
  group_sort_order: number
}

interface FieldGroup {
  id: number
  name: string
  sort_order: number
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
    // flex 为 0 表示固定宽度，否则使用 flex 比例
    ...(flex === 0 && width ? { width: `${width}px`, flexShrink: 0 } : { flex: flex }),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative flex items-center justify-center text-xs font-medium select-none text-gray-500 bg-gray-50 h-10
        ${isCheckbox ? 'pl-4 pr-2' : 'px-2'}
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
  group: FieldGroup
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

// 可拖拽的字段行组件
export default function BasicInfoPage() {
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

  const [fields, setFields] = useState<BasicField[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false)
  const [editingField, setEditingField] = useState<BasicField | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [previewValue, setPreviewValue] = useState<string>('') // 预览生成的值
  const [previewLoading, setPreviewLoading] = useState(false) // 预览加载状态
  const [formData, setFormData] = useState({
    fieldName: '',
    displayName: '', // 扩展名称（显示名称）
    fieldCode: '', // 数据库字段名，用于标识货号等特殊字段
    fieldType: 'text',
    isRequired: false,
    options: '',
    defaultValue: 'none', // 默认值（布尔值: 'none'表示无默认值, 'true'/'false'表示具体值）
    enabled: true,
    group: '',
    autoGenerate: false, // 是否自动生成
    codeRuleId: null as number | null, // 关联的编码规则ID
    dataSource: 'manual', // 数据来源：manual（手动输入）| supplier（供应商列表）
    suppliers: [] as Array<{ id: number; supplier_name: string }>, // 供应商列表数据
    codeRules: [] as Array<{ id: number; rule_name: string }>, // 编码规则列表
    // Layout configuration
    width: 100,
    columns: 1,
    columnWidth: 1,
    spacing: 2,
    rowIndex: 1,
    newRow: false,
    groupSortOrder: 0,
  })
  const [batchFormData, setBatchFormData] = useState({
    group: { value: '', enabled: false },
    width: { value: 100, enabled: false },
    columns: { value: 1, enabled: false },
    columnWidth: { value: 1, enabled: false },
    spacing: { value: 2, enabled: false },
    rowIndex: { value: 1, enabled: false },
    newRow: { value: false, enabled: false },
    groupSortOrder: { value: 0, enabled: false },
  })
  const { toast } = useToast()

  // 弹窗拖拽相关状态
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 })
  const [isDraggingDialog, setIsDraggingDialog] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const dialogRef = useRef<HTMLDivElement>(null)

  // 弹窗拖拽处理函数
  const handleDialogDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingDialog(true)
    dragStartPos.current = {
      x: e.clientX - dialogPosition.x,
      y: e.clientY - dialogPosition.y,
    }
  }

  const handleDialogDrag = (e: MouseEvent) => {
    if (!isDraggingDialog) return
    const newX = e.clientX - dragStartPos.current.x
    const newY = e.clientY - dragStartPos.current.y
    setDialogPosition({ x: newX, y: newY })
  }

  const handleDialogDragEnd = () => {
    setIsDraggingDialog(false)
  }

  // 重置弹窗位置
  const resetDialogPosition = () => {
    setDialogPosition({ x: 0, y: 0 })
  }

  // 添加拖拽事件监听
  useEffect(() => {
    if (isDraggingDialog) {
      document.addEventListener('mousemove', handleDialogDrag)
      document.addEventListener('mouseup', handleDialogDragEnd)
    }
    return () => {
      document.removeEventListener('mousemove', handleDialogDrag)
      document.removeEventListener('mouseup', handleDialogDragEnd)
    }
  }, [isDraggingDialog])

  // 分组管理相关 state
  const [groups, setGroups] = useState<FieldGroup[]>([])
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [groupSubmitting, setGroupSubmitting] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null) // 选中的分组ID，用于筛选
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null) // 正在编辑的分组ID
  const [editingGroupName, setEditingGroupName] = useState('') // 正在编辑的分组名称

  // 列配置
  interface ColumnConfig {
    key: string
    label: string
    flex: number // flex 比例，0 表示固定宽度
    width?: number // 固定宽度（仅 flex 为 0 时使用）
    freezable?: boolean
    defaultVisible?: boolean
  }

  const defaultColumns: ColumnConfig[] = [
    { key: 'checkbox', label: '', flex: 0, width: 36, freezable: false, defaultVisible: true },
    { key: 'index', label: '序号', flex: 0, width: 50, freezable: false, defaultVisible: true },
    { key: 'group', label: '分组', flex: 2, freezable: true, defaultVisible: true },
    { key: 'fieldName', label: '字段名称', flex: 3, freezable: true, defaultVisible: true },
    { key: 'displayName', label: '显示名称', flex: 3, freezable: true, defaultVisible: true },
    { key: 'fieldType', label: '类型', flex: 1.5, freezable: false, defaultVisible: true },
    { key: 'width', label: '宽度', flex: 1, freezable: false, defaultVisible: true },
    { key: 'columns', label: '列数', flex: 1, freezable: false, defaultVisible: true },
    { key: 'columnWidth', label: '列宽', flex: 1, freezable: false, defaultVisible: true },
    { key: 'spacing', label: '间距', flex: 1, freezable: false, defaultVisible: true },
    { key: 'rowIndex', label: '行号', flex: 1, freezable: false, defaultVisible: true },
    { key: 'isRequired', label: '必选', flex: 1, freezable: false, defaultVisible: true },
    { key: 'enabled', label: '启用', flex: 1, freezable: false, defaultVisible: true },
    { key: 'newRow', label: '新行', flex: 1, freezable: false, defaultVisible: true },
    { key: 'sort', label: '排序', flex: 0, width: 50, freezable: false, defaultVisible: true },
    { key: 'actions', label: '操作', flex: 0, width: 120, freezable: false, defaultVisible: true },
  ]

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fieldColumnOrder')
      return saved ? JSON.parse(saved) : defaultColumns.map(c => c.key)
    }
    return defaultColumns.map(c => c.key)
  })

  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  const [allowWrap, setAllowWrap] = useState(false) // 控制文本是否允许换行

  // 列设置相关
  interface ColumnSettings {
    key: string
    visible: boolean
    frozen: boolean
  }
  
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false)
  const [columnSettings, setColumnSettings] = useState<ColumnSettings[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('basicFieldColumnSettings')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return defaultColumns.map(col => ({
      key: col.key,
      visible: col.defaultVisible !== false,
      frozen: false,
    }))
  })
  const [tempColumnSettings, setTempColumnSettings] = useState<ColumnSettings[]>([])
  const [tempColumnOrder, setTempColumnOrder] = useState<string[]>([]) // 临时列顺序

  // 同步列设置到列顺序（保存时调用）
  const syncColumnSettings = (settings: ColumnSettings[], order?: string[]) => {
    const newOrder = order || settings.map(s => s.key)

    setColumnOrder(newOrder)

    // 保存到 localStorage
    localStorage.setItem('basicFieldColumnSettings', JSON.stringify(settings))
    localStorage.setItem('fieldColumnOrder', JSON.stringify(newOrder))
  }

  // 初始化列设置（确保所有列都在）
  useEffect(() => {
    const saved = localStorage.getItem('basicFieldColumnSettings')
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
      description: '列显示、冻结设置已恢复为默认值',
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

  // 切换文本换行状态
  const handleToggleWrap = () => {
    setAllowWrap(!allowWrap)
    toast({
      title: allowWrap ? '文本已不换行' : '文本已允许换行',
      description: allowWrap ? '文本将显示省略号' : '文本将完整显示',
    })
  }

  // 列排序相关
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

  const handleColumnDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id)
        const newIndex = items.indexOf(over.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        if (typeof window !== 'undefined') {
          localStorage.setItem('fieldColumnOrder', JSON.stringify(newOrder))
        }
        return newOrder
      })
    }
  }

  // 行拖拽处理
  const handleRowDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = parseInt(active.id as string)
    const overId = parseInt(over.id as string)
    
    // 找到拖拽项在 filteredFields 中的索引
    const activeIndex = filteredFields.findIndex(f => f.id === activeId)
    const overIndex = filteredFields.findIndex(f => f.id === overId)
    
    if (activeIndex === -1 || overIndex === -1) return
    
    // 获取两个字段的分组信息
    const activeField = filteredFields[activeIndex]
    const overField = filteredFields[overIndex]
    
    // 如果是不同分组，不允许拖拽
    if (activeField.group_id !== overField.group_id) {
      toast({
        variant: 'destructive',
        title: '无法跨分组拖拽',
        description: '请将字段拖拽到同一分组内的位置',
      })
      return
    }
    
    // 计算新的排序顺序
    const newFields = [...filteredFields]
    newFields.splice(activeIndex, 1)
    newFields.splice(overIndex, 0, activeField)
    
    // 更新本地状态
    setFields(prevFields => {
      const otherFields = prevFields.filter(f => 
        !filteredFields.some(ff => ff.id === f.id)
      )
      return [...otherFields, ...newFields]
    })
    
    // 更新服务器端排序
    const sameGroupFields = newFields.filter(f => f.group_id === activeField.group_id)
    await Promise.all(
      sameGroupFields.map((field, index) =>
        fetch(`/api/products/basic-fields/${field.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fieldName: field.field_name,
            fieldCode: field.field_code,
            fieldType: field.field_type,
            sortOrder: index,
            enabled: field.enabled,
            options: field.options,
          }),
        })
      )
    )
    
    toast({
      title: '排序已更新',
      description: '字段顺序已保存',
    })
  }

  const fetchFields = async () => {
    try {
      const response = await fetch('/api/products/basic-fields')
      const result = await response.json()
      if (result.data) {
        // 排序由 filteredFields 的 useMemo 处理，按分组 sort_order + 字段 sort_order 排序
        setFields(result.data)
      }
    } catch (error) {
      console.error('获取字段列表失败:', error)
      toast({
        variant: 'destructive',
        title: '加载失败',
        description: '无法加载字段列表',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/products/field-groups')
      const result = await response.json()
      if (result.data) {
        setGroups(result.data)
      }
    } catch (error) {
      console.error('获取分组列表失败:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const result = await response.json()
      if (result.data) {
        setFormData(prev => ({ ...prev, suppliers: result.data }))
      }
    } catch (error) {
      console.error('获取供应商列表失败:', error)
    }
  }

  const fetchCodeRules = async () => {
    try {
      const response = await fetch('/api/products/code-rules')
      const result = await response.json()
      if (result.data) {
        setFormData(prev => ({ ...prev, codeRules: result.data }))
      }
    } catch (error) {
      console.error('获取编码规则列表失败:', error)
    }
  }

  // 预览生成字段值
  const previewGenerateValue = async () => {
    if (!formData.codeRuleId) {
      toast({
        variant: 'destructive',
        title: '请先选择编码规则',
        description: '需要选择一个编码规则才能预览生成效果',
      })
      return
    }

    setPreviewLoading(true)
    try {
      const response = await fetch('/api/products/generate-field-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldCode: formData.fieldCode,
          codeRuleId: formData.codeRuleId,
          basicFieldValues: {}, // 预览时使用空值
          attributeValues: {}, // 预览时使用空值
        }),
      })

      const result = await response.json()
      if (result.success) {
        setPreviewValue(result.data.value)
      } else {
        throw new Error(result.error || '预览失败')
      }
    } catch (error) {
      console.error('预览生成失败:', error)
      toast({
        variant: 'destructive',
        title: '预览失败',
        description: error instanceof Error ? error.message : '请检查配置',
      })
      setPreviewValue('')
    } finally {
      setPreviewLoading(false)
    }
  }

  // 安全的 parseInt，避免 NaN
  const safeParseInt = (value: string, defaultValue: number = 0): number => {
    const parsed = parseInt(value)
    return isNaN(parsed) ? defaultValue : parsed
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchFields(), fetchGroups()])
    }
    loadData()
  }, [])

  // 分组拖拽处理
  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = parseInt(active.id as string)
    const overId = parseInt(over.id as string)
    
    // 找到拖拽项在 groups 中的索引
    const activeIndex = groups.findIndex(g => g.id === activeId)
    const overIndex = groups.findIndex(g => g.id === overId)
    
    if (activeIndex === -1 || overIndex === -1) return
    
    // 计算新的排序顺序
    const newGroups = [...groups]
    newGroups.splice(activeIndex, 1)
    newGroups.splice(overIndex, 0, groups[activeIndex])
    
    // 更新每个分组的 sort_order 值
    const updatedGroups = newGroups.map((group, index) => ({
      ...group,
      sort_order: index
    }))
    
    // 更新本地状态（使用更新了 sort_order 的新数组）
    setGroups(updatedGroups)
    
    // 更新服务器端排序
    try {
      await Promise.all(
        updatedGroups.map((group) =>
          fetch(`/api/products/field-groups/${group.id}`, {
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
        description: '分组顺序已保存，字段列表已同步更新',
      })
    } catch (error) {
      console.error('更新分组排序失败:', error)
      toast({
        variant: 'destructive',
        title: '更新失败',
        description: '分组排序更新失败，请重试',
      })
      // 恢复原始顺序
      fetchGroups()
    }
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
      const response = await fetch('/api/products/field-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() }),
      })

      if (response.ok) {
        setNewGroupName('')
        setIsGroupDialogOpen(false)
        fetchGroups()
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
      const response = await fetch(`/api/products/field-groups/${groupId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchGroups()
        fetchFields()
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
      const response = await fetch(`/api/products/field-groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (response.ok) {
        fetchGroups()
        fetchFields()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleSubmit called', { formData })
    setSubmitting(true)
    try {
      // 表单验证：必填字段
      if (!formData.fieldName.trim()) {
        toast({
          variant: 'destructive',
          title: '字段名称不能为空',
          description: '请输入字段名称',
        })
        setSubmitting(false)
        return
      }

      // 验证自动生成配置
      if (formData.autoGenerate && !formData.codeRuleId) {
        toast({
          variant: 'destructive',
          title: '请选择编码规则',
          description: '启用自动生成时必须选择一个编码规则',
        })
        setSubmitting(false)
        return
      }

      // 生成唯一的 db_field_name
      let finalFieldCode = formData.fieldCode
      
      if (finalFieldCode && !editingField) {
        // 添加模式：检查是否已存在，如果存在则自动添加后缀
        const existingDbField = fields.find(f => f.field_code === finalFieldCode)
        if (existingDbField) {
          // 自动生成唯一的字段名
          let counter = 1
          while (fields.find(f => f.field_code === `${finalFieldCode}_${counter}`)) {
            counter++
          }
          finalFieldCode = `${finalFieldCode}_${counter}`
          console.log(`数据库字段名已存在，自动调整为: ${finalFieldCode}`)
        }
      } else if (finalFieldCode && editingField) {
        // 编辑模式：检查其他字段是否使用了相同的名称
        const otherDbField = fields.find(f => f.field_code === finalFieldCode && f.id !== editingField.id)
        if (otherDbField) {
          toast({
            variant: 'destructive',
            title: '数据库字段名已存在',
            description: `数据库字段名 "${formData.fieldCode}" 已被 "${otherDbField.field_name}" 使用，请修改字段名称`,
          })
          setSubmitting(false)
          return
        }
      }

      let options = null
      
      if (formData.fieldType === 'select') {
        if (formData.dataSource === 'supplier') {
          // 使用供应商列表作为选项
          options = formData.suppliers.map(supplier => ({
            label: supplier.supplier_name,
            value: supplier.id.toString(),
            source: 'supplier', // 标记数据来源
          }))
        } else {
          // 手动输入的选项
          options = formData.options.split('\n').map((opt: string) => {
            const [label, value] = opt.split(':').map(s => s.trim())
            return { label: label || value, value: value || label }
          })
        }
      }

      const payload = {
        fieldName: formData.fieldName,
        displayName: formData.displayName || formData.fieldName,
        fieldCode: finalFieldCode,
        fieldType: formData.fieldType,
        isRequired: formData.isRequired,
        options,
        defaultValue: formData.defaultValue === 'none' ? null : formData.defaultValue,
        enabled: formData.enabled,
        group: formData.group,
        autoGenerate: formData.autoGenerate,
        codeRuleId: formData.codeRuleId,
        // Layout configuration
        width: formData.width,
        columns: formData.columns,
        columnWidth: formData.columnWidth,
        spacing: formData.spacing,
        rowIndex: formData.rowIndex,
        newRow: formData.newRow,
        groupSortOrder: formData.groupSortOrder,
        sortOrder: editingField ? editingField.sort_order : fields.length,
      }

      console.log('Sending payload:', payload)

      const url = editingField
        ? `/api/products/basic-fields/${editingField.id}`
        : '/api/products/basic-fields'

      console.log('Request URL:', url, 'Method:', editingField ? 'PUT' : 'POST')

      const response = await fetch(url, {
        method: editingField ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', response.status, 'Response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('Response data:', result)
        setIsDialogOpen(false)
        resetDialogPosition()
        fetchFields()
        resetForm()
        toast({
          title: editingField ? '更新成功' : '添加成功',
          description: editingField ? '字段已更新' : '字段已添加',
        })
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        let errorMessage = error.error || '操作失败'
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('保存字段失败:', error)
      toast({
        variant: 'destructive',
        title: '操作失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIds.size === 0) {
      toast({
        variant: 'destructive',
        title: '请选择字段',
        description: '请先选择要批量编辑的字段',
      })
      return
    }

    // 构建只包含启用参数的更新对象
    const updateData: any = {}
    if (batchFormData.group.enabled) updateData.group = batchFormData.group.value
    if (batchFormData.width.enabled) updateData.width = batchFormData.width.value
    if (batchFormData.columns.enabled) updateData.columns = batchFormData.columns.value
    if (batchFormData.columnWidth.enabled) updateData.columnWidth = batchFormData.columnWidth.value
    if (batchFormData.spacing.enabled) updateData.spacing = batchFormData.spacing.value
    if (batchFormData.rowIndex.enabled) updateData.rowIndex = batchFormData.rowIndex.value
    if (batchFormData.newRow.enabled) updateData.newRow = batchFormData.newRow.value
    if (batchFormData.groupSortOrder.enabled) updateData.groupSortOrder = batchFormData.groupSortOrder.value

    // 检查是否有启用的参数
    const enabledCount = Object.values(batchFormData).filter((item: any) => item.enabled).length
    if (enabledCount === 0) {
      toast({
        variant: 'destructive',
        title: '请选择要修改的配置项',
        description: '请至少勾选一个配置项',
      })
      return
    }

    setSubmitting(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/products/basic-fields/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          })
        )
      )

      setIsBatchEditOpen(false)
      setSelectedIds(new Set())
      fetchFields()
      toast({
        title: '批量更新成功',
        description: `已更新 ${selectedIds.size} 个字段的 ${enabledCount} 个配置项`,
      })
    } catch (error) {
      console.error('批量更新失败:', error)
      toast({
        variant: 'destructive',
        title: '批量更新失败',
        description: '请重试',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个字段吗？')) return
    
    try {
      const response = await fetch(`/api/products/basic-fields/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchFields()
        toast({
          title: '删除成功',
          description: '字段已删除',
        })
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除字段失败:', error)
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: '请重试',
      })
    }
  }

  const handleEdit = async (field: BasicField) => {
    setEditingField(field)
    
    // 判断数据来源（如果options包含supplier标记，则使用供应商列表）
    const isSupplierData = field.options?.some((opt: any) => opt.source === 'supplier')
    
    setFormData({
      fieldName: field.field_name,
      displayName: field.display_name || field.field_name,
      fieldCode: field.field_code || '',
      fieldType: field.field_type,
      isRequired: field.is_required,
      options: field.options
        ? field.options
            .filter((opt: any) => !opt.source) // 过滤掉标记为供应商的选项
            .map((opt: any) => `${opt.label}:${opt.value}`)
            .join('\n')
        : '',
      defaultValue: field.default_value || 'none',
      enabled: field.enabled !== undefined ? field.enabled : true,
      group: field.group_id?.toString() || '',
      autoGenerate: field.auto_generate || false,
      codeRuleId: field.code_rule_id || null,
      dataSource: isSupplierData ? 'supplier' : 'manual',
      suppliers: [], // 后续会加载
      codeRules: [], // 后续会加载
      // Layout configuration
      width: field.width || 100,
      columns: field.columns || 1,
      columnWidth: field.column_width || 1,
      spacing: field.spacing || 2,
      rowIndex: field.row_index || 1,
      newRow: field.new_row || false,
      groupSortOrder: field.group_sort_order || 0,
    })
    
    setIsDialogOpen(true)
    
    // 如果字段类型是select，获取供应商列表
    if (field.field_type === 'select') {
      await fetchSuppliers()
    }
    
    // 如果开启了自动生成，获取编码规则列表
    if (field.auto_generate) {
      await fetchCodeRules()
    }
  }

  // 计算分组中最大的行号，用于新字段默认排序
  const calculateMaxRowIndex = (groupId: string | null) => {
    if (!groupId) return 0
    const groupFields = fields.filter(f => f.group_id?.toString() === groupId.toString())
    return groupFields.length > 0 ? Math.max(...groupFields.map(f => f.sort_order || 0)) : 0
  }

  const resetForm = () => {
    setFormData({
      fieldName: '',
      displayName: '',
      fieldCode: '',
      fieldType: 'text',
      isRequired: false,
      options: '',
      defaultValue: '',
      enabled: true,
      group: '',
      autoGenerate: false,
      codeRuleId: null,
      dataSource: 'manual',
      suppliers: [],
      codeRules: [],
      // Layout configuration
      width: 100,
      columns: 1,
      columnWidth: 1,
      spacing: 2,
      rowIndex: 1,
      newRow: false,
      groupSortOrder: 0,
    })
    setEditingField(null)
  }

  // 处理字段启用/禁用
  const handleToggleField = async (field: BasicField) => {
    try {
      const response = await fetch(`/api/products/basic-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName: field.field_name,
          fieldType: field.field_type,
          isRequired: field.is_required,
          options: field.options,
          enabled: !field.enabled,
        }),
      })

      if (response.ok) {
        fetchFields()
        toast({
          title: field.enabled ? '已禁用' : '已启用',
          description: `字段 "${field.field_name}" ${field.enabled ? '已禁用' : '已启用'}`,
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

  // 处理必选切换
  const handleToggleRequired = async (field: BasicField) => {
    try {
      const response = await fetch(`/api/products/basic-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName: field.field_name,
          fieldCode: field.field_code,
          fieldType: field.field_type,
          isRequired: !field.is_required,
          options: field.options,
          enabled: field.enabled,
        }),
      })

      if (response.ok) {
        fetchFields()
        toast({
          title: !field.is_required ? '已设为必选' : '已取消必选',
          description: `字段 "${field.field_name}" ${!field.is_required ? '已设为必选字段' : '已取消必选'}`,
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('API错误响应:', response.status, errorData)
        throw new Error(errorData.error || '操作失败')
      }
    } catch (error) {
      console.error('切换必选状态失败:', error)
      toast({
        variant: 'destructive',
        title: '操作失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    }
  }

  // 处理新行切换
  const handleToggleNewRow = async (field: BasicField) => {
    try {
      const response = await fetch(`/api/products/basic-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName: field.field_name,
          fieldCode: field.field_code,
          fieldType: field.field_type,
          isRequired: field.is_required,
          options: field.options,
          enabled: field.enabled,
          newRow: !field.new_row,
        }),
      })

      if (response.ok) {
        fetchFields()
        toast({
          title: !field.new_row ? '已开启新行' : '已关闭新行',
          description: `字段 "${field.field_name}" ${!field.new_row ? '将单独占据一行' : '将正常排列'}`,
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

  // 字段上移
  const moveFieldUp = async (index: number) => {
    if (index <= 0) return

    const newFields = [...fields]
    const temp = newFields[index]
    newFields[index] = newFields[index - 1]
    newFields[index - 1] = temp

    await updateFieldSortOrders(newFields)
  }

  // 字段下移
  const moveFieldDown = async (index: number) => {
    if (index >= fields.length - 1) return

    const newFields = [...fields]
    const temp = newFields[index]
    newFields[index] = newFields[index + 1]
    newFields[index + 1] = temp

    await updateFieldSortOrders(newFields)
  }

  // 更新字段排序
  const updateFieldSortOrders = async (newFields: BasicField[]) => {
    try {
      await Promise.all(
        newFields.map((field, index) =>
          fetch(`/api/products/basic-fields/${field.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fieldName: field.field_name,
              fieldCode: field.field_code,
              fieldType: field.field_type,
              isRequired: field.is_required,
              options: field.options,
              enabled: field.enabled,
              width: field.width,
              columns: field.columns,
              columnWidth: field.column_width,
              spacing: field.spacing,
              rowIndex: field.row_index,
              newRow: field.new_row,
              groupSortOrder: field.group_sort_order,
              sortOrder: index,
            }),
          })
        )
      )
      fetchFields()
    } catch (error) {
      console.error('更新字段排序失败:', error)
      toast({
        variant: 'destructive',
        title: '排序失败',
        description: '请重试',
      })
    }
  }

  // 选择/取消选择所有
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredFields.map(f => f.id)))
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

  // 使用 useMemo 缓存 filteredFields，避免每次渲染都创建新引用
  const filteredFields = useMemo(() => {
    return fields
      .filter(field => {
        // 分组筛选
        if (selectedGroupId !== null) {
          if (field.group_id !== selectedGroupId) {
            return false
          }
        }

        // 搜索筛选
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
          field.field_name.toLowerCase().includes(query) ||
          field.field_code.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => {
        // 先按分组的 sort_order 排序
        const aGroupSortOrder = groups.find(g => g.id === a.group_id)?.sort_order ?? 999999
        const bGroupSortOrder = groups.find(g => g.id === b.group_id)?.sort_order ?? 999999
        if (aGroupSortOrder !== bGroupSortOrder) {
          return aGroupSortOrder - bGroupSortOrder
        }
        // 同一分组内按 sort_order 排序
        const aSortOrder = a.sort_order || 0
        const bSortOrder = b.sort_order || 0
        return aSortOrder - bSortOrder
      })
  }, [fields, groups, selectedGroupId, searchQuery])


  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: '文本',
      number: '数字',
      select: '单选',
      boolean: '布尔值',
    }
    return labels[type] || type
  }

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
        <h1 className="text-2xl font-medium text-gray-900 mb-1">基本信息管理</h1>
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
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                添加分组
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-medium">添加分组</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="groupName">分组名称</Label>
                  <Input
                    id="groupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="例如：基本信息"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsGroupDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleAddGroup} disabled={groupSubmitting}>
                  {groupSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  添加
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {groups.length === 0 ? (
          <p className="text-sm text-gray-400">暂无分组，点击上方按钮添加</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGroupDragEnd}
          >
            <SortableContext
              items={groups.map(g => g.id.toString())}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
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
                {groups.find(g => g.id === selectedGroupId)?.name}
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
      <div className="mb-6 flex items-center gap-3">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="搜索字段名称或编码..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        {/* 列设置按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={handleOpenColumnSettings}>
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>列设置</p>
          </TooltipContent>
        </Tooltip>

        <Dialog open={isColumnSettingsOpen} onOpenChange={setIsColumnSettingsOpen}>
          <DialogContent className="max-w-2xl w-[85vw] h-auto max-h-[85vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-4 py-2.5 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-sm">列设置</DialogTitle>
                <Button variant="outline" size="sm" onClick={handleResetColumnSettings} className="h-7 text-xs px-3">
                  重置默认
                </Button>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto">
              {/* 列配置列表 */}
              <div className="px-4 py-2.5">
                <div className="text-xs font-medium text-gray-600 mb-2">列配置（拖动调整顺序）</div>
                
                <div className="space-y-1">
                  {tempColumnOrder.map((colKey, index) => {
                    const col = defaultColumns.find(c => c.key === colKey)
                    const setting = tempColumnSettings.find(s => s.key === colKey)
                    if (!col || !setting) return null
                    
                    const isFixed = colKey === 'checkbox' || colKey === 'actions' // 固定列不可隐藏

                    return (
                      <div
                        key={colKey}
                        className={`flex items-center gap-3 px-3 py-2 border rounded-md transition-colors ${isFixed ? 'bg-gray-50/50 border-gray-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                      >
                        {/* 排序按钮 */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            onClick={() => handleMoveColumnUp(colKey)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            onClick={() => handleMoveColumnDown(colKey)}
                            disabled={index === tempColumnOrder.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* 列名 */}
                        <span className="text-xs font-medium text-gray-700 min-w-[60px]">{col.label || '-'}</span>

                        {/* 显示/隐藏 */}
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Switch
                            checked={setting.visible}
                            onCheckedChange={() => handleToggleColumnVisible(colKey)}
                            disabled={isFixed}
                            className="data-[state=checked]:bg-green-500 scale-75"
                          />
                          <span className="text-xs text-gray-500">显示</span>
                        </div>

                        {/* 冻结 */}
                        {col.freezable && (
                          <div className="flex items-center gap-1 whitespace-nowrap ml-auto">
                            <Switch
                              checked={setting.frozen}
                              onCheckedChange={() => handleToggleColumnFrozen(colKey)}
                              disabled={!setting.visible}
                              className="data-[state=checked]:bg-blue-500 scale-75"
                            />
                            <span className="text-xs text-gray-500">冻结</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 py-2.5 border-t flex-shrink-0 bg-gray-50/30">
              <Button variant="outline" size="sm" onClick={handleCancelColumnSettings} className="h-8 text-xs px-4">
                取消
              </Button>
              <Button size="sm" onClick={handleSaveColumnSettings} className="h-8 text-xs px-4 bg-blue-500 hover:bg-blue-600">
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
              newRow: { value: false, enabled: false },
              groupSortOrder: { value: 0, enabled: false },
            })
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={selectedIds.size === 0}>
              <Settings2 className="h-4 w-4 mr-2" />
              批量编辑 ({selectedIds.size})
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-4 py-2.5 border-b flex-shrink-0">
              <DialogTitle className="text-sm font-medium">批量编辑布局配置</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBatchEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    已选择 <span className="font-medium text-blue-600">{selectedIds.size}</span> 个字段
                  </p>
                  <p className="text-[10px] text-gray-400">
                    仅勾选的配置项会被更新
                  </p>
                </div>
                
                {/* 分组 */}
                <div className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-md bg-blue-50/30">
                  <Switch
                    checked={batchFormData.group.enabled}
                    onCheckedChange={(checked) => setBatchFormData({ 
                      ...batchFormData, 
                      group: { ...batchFormData.group, enabled: checked } 
                    })}
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <div className="flex-1">
                    <Label htmlFor="batchGroup" className="text-xs text-gray-600 mb-1 block">分组</Label>
                    <Select
                      value={batchFormData.group.value}
                      onValueChange={(value) => setBatchFormData({ 
                        ...batchFormData, 
                        group: { ...batchFormData.group, value: value } 
                      })}
                      disabled={!batchFormData.group.enabled}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue placeholder="选择分组" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()} className="text-xs">
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 布局配置 - 2x2 网格 */}
                <div className="grid grid-cols-2 gap-2">
                  {/* 宽度 */}
                  <div className={`flex items-center gap-2 p-2.5 border rounded-md ${batchFormData.width.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                    <Switch
                      checked={batchFormData.width.enabled}
                      onCheckedChange={(checked) => setBatchFormData({ 
                        ...batchFormData, 
                        width: { ...batchFormData.width, enabled: checked } 
                      })}
                      className="data-[state=checked]:bg-blue-500 scale-75"
                    />
                    <div className="flex-1">
                      <Label htmlFor="batchWidth" className="text-xs text-gray-600 mb-1 block">宽度 (%)</Label>
                      <Input
                        id="batchWidth"
                        type="number"
                        value={batchFormData.width.value}
                        onChange={(e) => setBatchFormData({ 
                          ...batchFormData, 
                          width: { ...batchFormData.width, value: safeParseInt(e.target.value, 100) } 
                        })}
                        min="1"
                        max="100"
                        disabled={!batchFormData.width.enabled}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* 列数 */}
                  <div className={`flex items-center gap-2 p-2.5 border rounded-md ${batchFormData.columns.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                    <Switch
                      checked={batchFormData.columns.enabled}
                      onCheckedChange={(checked) => setBatchFormData({ 
                        ...batchFormData, 
                        columns: { ...batchFormData.columns, enabled: checked } 
                      })}
                      className="data-[state=checked]:bg-blue-500 scale-75"
                    />
                    <div className="flex-1">
                      <Label htmlFor="batchColumns" className="text-xs text-gray-600 mb-1 block">列数</Label>
                      <Input
                        id="batchColumns"
                        type="number"
                        value={batchFormData.columns.value}
                        onChange={(e) => setBatchFormData({ 
                          ...batchFormData, 
                          columns: { ...batchFormData.columns, value: safeParseInt(e.target.value, 1) } 
                        })}
                        min="1"
                        max="12"
                        disabled={!batchFormData.columns.enabled}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* 间距 */}
                  <div className={`flex items-center gap-2 p-2.5 border rounded-md ${batchFormData.spacing.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                    <Switch
                      checked={batchFormData.spacing.enabled}
                      onCheckedChange={(checked) => setBatchFormData({ 
                        ...batchFormData, 
                        spacing: { ...batchFormData.spacing, enabled: checked } 
                      })}
                      className="data-[state=checked]:bg-blue-500 scale-75"
                    />
                    <div className="flex-1">
                      <Label htmlFor="batchSpacing" className="text-xs text-gray-600 mb-1 block">间距</Label>
                      <Input
                        id="batchSpacing"
                        type="number"
                        value={batchFormData.spacing.value}
                        onChange={(e) => setBatchFormData({ 
                          ...batchFormData, 
                          spacing: { ...batchFormData.spacing, value: safeParseInt(e.target.value, 2) } 
                        })}
                        min="0"
                        max="5"
                        disabled={!batchFormData.spacing.enabled}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* 第几行 */}
                  <div className={`flex items-center gap-2 p-2.5 border rounded-md ${batchFormData.rowIndex.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                    <Switch
                      checked={batchFormData.rowIndex.enabled}
                      onCheckedChange={(checked) => setBatchFormData({ 
                        ...batchFormData, 
                        rowIndex: { ...batchFormData.rowIndex, enabled: checked } 
                      })}
                      className="data-[state=checked]:bg-blue-500 scale-75"
                    />
                    <div className="flex-1">
                      <Label htmlFor="batchRowIndex" className="text-xs text-gray-600 mb-1 block">行号</Label>
                      <Input
                        id="batchRowIndex"
                        type="number"
                        value={batchFormData.rowIndex.value}
                        onChange={(e) => setBatchFormData({ 
                          ...batchFormData, 
                          rowIndex: { ...batchFormData.rowIndex, value: safeParseInt(e.target.value, 1) } 
                        })}
                        min="1"
                        disabled={!batchFormData.rowIndex.enabled}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 列宽和分组内排序 - 单独一行 */}
                <div className="grid grid-cols-2 gap-2">
                  {/* 列宽 */}
                  <div className={`flex items-center gap-2 p-2.5 border rounded-md ${batchFormData.columnWidth.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                    <Switch
                      checked={batchFormData.columnWidth.enabled}
                      onCheckedChange={(checked) => setBatchFormData({ 
                        ...batchFormData, 
                        columnWidth: { ...batchFormData.columnWidth, enabled: checked } 
                      })}
                      className="data-[state=checked]:bg-blue-500 scale-75"
                    />
                    <div className="flex-1">
                      <Label htmlFor="batchColumnWidth" className="text-xs text-gray-600 mb-1 block">列宽</Label>
                      <Input
                        id="batchColumnWidth"
                        type="number"
                        value={batchFormData.columnWidth.value}
                        onChange={(e) => setBatchFormData({ 
                          ...batchFormData, 
                          columnWidth: { ...batchFormData.columnWidth, value: safeParseInt(e.target.value, 1) } 
                        })}
                        min="1"
                        max="12"
                        disabled={!batchFormData.columnWidth.enabled}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* 分组内排序 */}
                  <div className={`flex items-center gap-2 p-2.5 border rounded-md ${batchFormData.groupSortOrder.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                    <Switch
                      checked={batchFormData.groupSortOrder.enabled}
                      onCheckedChange={(checked) => setBatchFormData({ 
                        ...batchFormData, 
                        groupSortOrder: { ...batchFormData.groupSortOrder, enabled: checked } 
                      })}
                      className="data-[state=checked]:bg-blue-500 scale-75"
                    />
                    <div className="flex-1">
                      <Label htmlFor="batchGroupSortOrder" className="text-xs text-gray-600 mb-1 block">组内排序</Label>
                      <Input
                        id="batchGroupSortOrder"
                        type="number"
                        value={batchFormData.groupSortOrder.value}
                        onChange={(e) => setBatchFormData({ 
                          ...batchFormData, 
                          groupSortOrder: { ...batchFormData.groupSortOrder, value: safeParseInt(e.target.value, 0) } 
                        })}
                        min="0"
                        disabled={!batchFormData.groupSortOrder.enabled}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 新行 */}
                <div className={`flex items-center justify-between p-2.5 border rounded-md ${batchFormData.newRow.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch
                      id="batchNewRow"
                      checked={batchFormData.newRow.enabled}
                      onCheckedChange={(checked) => setBatchFormData({ 
                        ...batchFormData, 
                        newRow: { ...batchFormData.newRow, enabled: checked } 
                      })}
                      className="data-[state=checked]:bg-blue-500"
                    />
                    <span className="text-xs text-gray-600">启用新行设置</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">新行</span>
                    <Switch
                      checked={batchFormData.newRow.value}
                      onCheckedChange={(checked) => setBatchFormData({ 
                        ...batchFormData, 
                        newRow: { ...batchFormData.newRow, value: checked } 
                      })}
                      disabled={!batchFormData.newRow.enabled}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-4 py-2.5 border-t flex-shrink-0 bg-gray-50/30">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsBatchEditOpen(false)} className="h-8 text-xs px-4">
                  取消
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs px-4 bg-blue-500 hover:bg-blue-600">
                  {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  批量更新
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* 添加按钮 */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            resetForm()
            resetDialogPosition()
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              添加字段
            </Button>
          </DialogTrigger>
          <DialogContent 
            ref={dialogRef}
            className="sm:max-w-[640px] max-h-[80vh] overflow-hidden p-0"
            style={{
              transform: `translate(${dialogPosition.x}px, ${dialogPosition.y}px)`,
            }}
            onPointerDownOutside={(e) => {
              // 如果正在拖拽，阻止关闭
              if (isDraggingDialog) {
                e.preventDefault()
              }
            }}
          >
            <DialogHeader 
              className="px-4 pt-4 pb-2.5 border-b border-gray-100 cursor-move select-none"
              onMouseDown={handleDialogDragStart}
            >
              <div className="flex items-center justify-between">
                <DialogTitle className="text-sm font-medium text-gray-900">
                  {editingField ? '编辑字段' : '添加字段'}
                </DialogTitle>
                <Move className="h-4 w-4 text-gray-400" />
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(80vh-100px)]">
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                {/* 字段设置 */}
                <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <Type className="h-3.5 w-3.5" />
                    字段设置
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Label htmlFor="fieldName" className="text-xs text-gray-500">原始名称</Label>
                        {editingField && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-gray-400 cursor-help">（不可修改）</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>原始名称用于标识字段，创建后不可修改。</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <Input
                        id="fieldName"
                        value={formData.fieldName}
                        onChange={(e) => {
                          // 新建模式下：原始名称变化时，显示名称自动同步
                          if (!editingField) {
                            setFormData({
                              ...formData,
                              fieldName: e.target.value,
                              displayName: e.target.value, // 自动同步显示名称
                              fieldCode: generateFieldCode(e.target.value)
                            })
                          }
                        }}
                        readOnly={!!editingField}
                        className={`h-8 text-xs ${editingField ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-200'} w-full`}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="displayName" className="text-xs text-gray-500 mb-1 block">显示名称</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            displayName: e.target.value,
                          })
                        }}
                        placeholder="商品列表、表单中显示的名称"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Label htmlFor="fieldCode" className="text-xs text-gray-500">数据库字段名</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-gray-400 cursor-help">（自动生成）</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>数据库字段名用于存储商品数据，自动生成不可修改。</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="fieldCode"
                        value={formData.fieldCode}
                        readOnly
                        className="h-8 text-xs bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fieldType" className="text-xs text-gray-500 mb-1 block">字段类型</Label>
                      <Select
                        value={formData.fieldType}
                        onValueChange={(value) => {
                          setFormData({ ...formData, fieldType: value, dataSource: 'manual' })
                          if (value === 'select') {
                            fetchSuppliers()
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text" className="text-xs">文本</SelectItem>
                          <SelectItem value="textarea" className="text-xs">文本多行</SelectItem>
                          <SelectItem value="number" className="text-xs">数字</SelectItem>
                          <SelectItem value="select" className="text-xs">单选</SelectItem>
                          <SelectItem value="boolean" className="text-xs">布尔值</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="group" className="text-xs text-gray-500 mb-1 block">分组</Label>
                      <Select
                        value={formData.group}
                        onValueChange={(value) => {
                          const maxRowIndex = calculateMaxRowIndex(value)
                          setFormData({
                            ...formData,
                            group: value,
                            rowIndex: maxRowIndex + 1
                          })
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full">
                          <SelectValue placeholder="选择分组" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()} className="text-xs">
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div></div>
                  </div>
                </div>

                {/* 布尔值默认值配置 */}
                {formData.fieldType === 'boolean' && (
                  <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      <ToggleRight className="h-3.5 w-3.5" />
                      默认值配置
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">默认值</Label>
                      <Select
                        value={formData.defaultValue}
                        onValueChange={(value) => setFormData({ ...formData, defaultValue: value })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full max-w-[200px]">
                          <SelectValue placeholder="选择默认值" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">无默认值</SelectItem>
                          <SelectItem value="true" className="text-xs">是 (true)</SelectItem>
                          <SelectItem value="false" className="text-xs">否 (false)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* 单选选项配置 */}
                {formData.fieldType === 'select' && (
                  <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      <List className="h-3.5 w-3.5" />
                      选项配置
                    </div>
                    <div>
                      <Label htmlFor="dataSource" className="text-xs text-gray-500 mb-1 block">数据来源</Label>
                      <Select
                        value={formData.dataSource}
                        onValueChange={(value) => setFormData({ ...formData, dataSource: value })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full max-w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual" className="text-xs">手动输入</SelectItem>
                          <SelectItem value="supplier" className="text-xs">供应商列表</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.dataSource === 'manual' ? (
                      <div>
                        <Label htmlFor="options" className="text-xs text-gray-500 mb-1 block">选项（每行一个，格式：标签:值）</Label>
                        <Textarea
                          id="options"
                          className="min-h-[60px] text-xs bg-white border-gray-200 w-full"
                          value={formData.options}
                          onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                          placeholder="是:yes&#10;否:no"
                        />
                      </div>
                    ) : (
                      <div className="p-2 bg-white border border-gray-200 rounded-md max-h-[80px] overflow-y-auto">
                        {formData.suppliers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {formData.suppliers.map((supplier) => (
                              <span key={supplier.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                {supplier.supplier_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">暂无供应商数据</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 状态设置 */}
                <div className="bg-gray-50/80 rounded-md p-2.5">
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
                        onChange={(e) => setFormData({ ...formData, width: safeParseInt(e.target.value, 100) })}
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
                        onChange={(e) => setFormData({ ...formData, columns: safeParseInt(e.target.value, 1) })}
                        min="1"
                        max="12"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rowIndex" className="text-xs text-gray-500 mb-1 block">行号</Label>
                      <Input
                        id="rowIndex"
                        type="number"
                        value={formData.rowIndex}
                        onChange={(e) => setFormData({ ...formData, rowIndex: safeParseInt(e.target.value, 1) })}
                        min="1"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="spacing" className="text-xs text-gray-500 mb-1 block">间距</Label>
                      <Input
                        id="spacing"
                        type="number"
                        value={formData.spacing}
                        onChange={(e) => setFormData({ ...formData, spacing: safeParseInt(e.target.value, 2) })}
                        min="0"
                        max="5"
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
                    <span className="text-[10px] text-gray-400">开启后，该字段单独占据一行</span>
                  </div>
                </div>

                {/* 自动生成 */}
                <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        id="autoGenerate"
                        checked={formData.autoGenerate}
                        onCheckedChange={(checked) => {
                          setFormData({ ...formData, autoGenerate: checked })
                          if (checked) {
                            fetchCodeRules()
                          }
                        }}
                        className="data-[state=checked]:bg-blue-500"
                      />
                      <span className="text-xs text-gray-600 font-medium">自动生成</span>
                    </label>
                  </div>
                  
                  {formData.autoGenerate && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5 border-t border-gray-200/50">
                      <div>
                        <Label htmlFor="codeRuleId" className="text-xs text-gray-500 mb-1 block">编码规则</Label>
                        <Select
                          value={formData.codeRuleId?.toString() || ''}
                          onValueChange={(value) => {
                            const parsedValue = parseInt(value)
                            setFormData({ ...formData, codeRuleId: isNaN(parsedValue) ? null : parsedValue })
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
                            <SelectValue placeholder="选择编码规则" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.codeRules.length > 0 ? (
                              formData.codeRules.map((rule) => (
                                <SelectItem key={rule.id} value={rule.id.toString()} className="text-xs">
                                  {rule.rule_name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-xs text-gray-500">
                                暂无编码规则
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">预览</Label>
                        <div className="flex items-center gap-2">
                          {previewValue ? (
                            <code className="flex-1 h-8 px-2 flex items-center bg-white border border-gray-200 rounded text-xs text-blue-600 font-mono truncate">{previewValue}</code>
                          ) : (
                            <span className="flex-1 h-8 px-2 flex items-center bg-white border border-gray-200 rounded text-xs text-gray-400">-</span>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={previewGenerateValue}
                            disabled={!formData.codeRuleId || previewLoading}
                          >
                            {previewLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 底部按钮 */}
              <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="h-8 text-xs px-4">
                  取消
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs px-4 bg-blue-500 hover:bg-blue-600">
                  {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  保存
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fields List */}
      <div 
        className="bg-white overflow-hidden w-full"
        style={{ 
          borderRadius: 'var(--card-radius)',
          borderWidth: 'var(--card-border-width)',
          borderColor: 'var(--border-color)',
          borderStyle: 'solid'
        }}
      >
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
                        {colKey === 'checkbox' && fields.length > 0 && (
                          <Checkbox
                            checked={selectedIds.size === fields.length && selectedIds.size > 0}
                            onCheckedChange={handleSelectAll}
                            className="m-0"
                          />
                        )}
                        {colKey === 'index' && <span>序号</span>}
                        {colKey === 'group' && <span>分组</span>}
                        {colKey === 'fieldName' && <span>字段名称</span>}
                        {colKey === 'displayName' && <span>显示名称</span>}
                        {colKey === 'fieldType' && <span>类型</span>}
                        {colKey === 'width' && <span>宽度</span>}
                        {colKey === 'columns' && <span>列数</span>}
                        {colKey === 'columnWidth' && <span>列宽</span>}
                        {colKey === 'spacing' && <span>间距</span>}
                        {colKey === 'rowIndex' && <span>行号</span>}
                        {colKey === 'isRequired' && <span>必选</span>}
                        {colKey === 'enabled' && <span>启用</span>}
                        {colKey === 'newRow' && <span>新行</span>}
                        {colKey === 'sort' && <span>排序</span>}
                      </SortableHeaderCell>
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>

        {/* 数据行 */}
        {fields.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm text-gray-400">暂无字段配置，点击上方按钮添加</p>
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm text-gray-400 mb-3">未找到匹配的字段</p>
            <Button variant="ghost" onClick={() => setSearchQuery('')}>
              清除搜索
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredFields.map((field, index) => (
              <div key={field.id} className="group flex items-center hover:bg-gray-50 transition-colors h-11">
                {columnOrder.map((colKey) => {
                    const column = defaultColumns.find(c => c.key === colKey)
                    const setting = columnSettings.find(s => s.key === colKey)
                    if (!column || !setting?.visible) return null
                    // 跳过操作列，在固定区域单独渲染
                    if (colKey === 'actions') return null

                    // flex 为 0 表示固定宽度，否则使用 flex 比例
                    const cellStyle: React.CSSProperties = column.flex === 0 && column.width
                      ? { width: `${column.width}px`, flexShrink: 0 }
                      : { flex: column.flex }

                    return (
                      <div
                        key={colKey}
                        className={`flex items-center justify-center ${colKey === 'checkbox' ? 'pl-4 pr-2' : 'px-2'}`}
                        style={cellStyle}
                      >
                        {colKey === 'checkbox' && (
                          <Checkbox
                            checked={selectedIds.has(field.id)}
                            onCheckedChange={() => handleToggleSelect(field.id)}
                            className="m-0"
                          />
                        )}
                        {colKey === 'index' && (
                          <span className="text-sm text-gray-600">{index + 1}</span>
                        )}
                        {colKey === 'group' && (
                          <span className={`text-sm text-gray-600 ${allowWrap ? 'break-words' : 'truncate'}`}>
                            {field.field_group?.name || '-'}
                          </span>
                        )}
                        {colKey === 'fieldName' && (
                          <span className={`text-sm font-medium text-gray-900 px-1 ${allowWrap ? 'break-words' : 'truncate'}`}>{field.field_name}</span>
                        )}
                        {colKey === 'displayName' && (
                          <span className={`text-sm text-gray-700 px-1 ${allowWrap ? 'break-words' : 'truncate'}`}>{field.display_name || field.field_name}</span>
                        )}
                        {colKey === 'fieldType' && (
                          <span className="text-sm text-gray-600">
                            {getFieldTypeLabel(field.field_type)}
                          </span>
                        )}
                        {colKey === 'width' && (
                          <span className="text-sm text-gray-600">{field.width}%</span>
                        )}
                        {colKey === 'columns' && (
                          <span className="text-sm text-gray-600">{field.columns}</span>
                        )}
                        {colKey === 'columnWidth' && (
                          <span className="text-sm text-gray-600">{field.column_width}</span>
                        )}
                        {colKey === 'spacing' && (
                          <span className="text-sm text-gray-600">{field.spacing}</span>
                        )}
                        {colKey === 'rowIndex' && (
                          <span className="text-sm text-gray-600">{field.row_index}</span>
                        )}
                        {colKey === 'isRequired' && (
                          <Switch
                            checked={field.is_required}
                            onCheckedChange={() => handleToggleRequired(field)}
                            className="data-[state=checked]:bg-red-600"
                          />
                        )}
                        {colKey === 'enabled' && (
                          <Switch
                            checked={field.enabled}
                            onCheckedChange={() => handleToggleField(field)}
                            className="data-[state=checked]:bg-green-600"
                          />
                        )}
                        {colKey === 'newRow' && (
                          <Switch
                            checked={field.new_row}
                            onCheckedChange={() => handleToggleNewRow(field)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        )}
                        {colKey === 'sort' && (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                              onClick={() => moveFieldUp(index)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                              onClick={() => moveFieldDown(index)}
                              disabled={index >= filteredFields.length - 1}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
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
          <div className="flex flex-col border-l border-gray-200 bg-white" style={{ minWidth: '120px', flexShrink: 0 }}>
            {/* 操作列表头 */}
            <div className="flex items-center justify-center bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 h-10">
              操作
            </div>
            {/* 操作列数据 */}
            {fields.length > 0 && filteredFields.length > 0 && (
              <div className="divide-y divide-gray-100">
                {filteredFields.map((field, index) => (
                  <div key={field.id} className="group flex items-center hover:bg-gray-50 transition-colors h-11">
                    <div className="flex items-center gap-1 px-2 w-full justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => handleEdit(field)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        编辑
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(field.id)}
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
    </div>
  )
}
