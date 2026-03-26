'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Loader2, Search, GripVertical, Settings2, Type, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BasicField {
  id: number
  field_name: string
  display_name: string
  field_code: string
  field_type: string
  is_required: boolean
  options: any
  default_value: string | null
  sort_order: number
  enabled: boolean
  group_name: string | null
  group_id: number | null
  group: {
    id: number
    name: string
  } | null
  width: number
  columns: number
  column_width: number
  spacing: number
  row_index: number
  new_row: boolean
  group_sort_order: number
  auto_generate: boolean
  code_rule_id: number | null
}

interface FieldGroup {
  id: number
  name: string
  sort_order: number
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
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm'
      } ${isDragging ? 'shadow-md' : ''}`}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-current" />
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
          className="w-20 px-1.5 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <span className="text-sm font-medium">{group.name}</span>
      )}
      
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className={`h-5 w-5 p-0 ${isSelected ? 'text-white hover:bg-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
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
          className={`h-5 w-5 p-0 ${isSelected ? 'text-white hover:bg-blue-600' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export default function SupplierBasicInfoPage() {
  const [fields, setFields] = useState<BasicField[]>([])
  const [groups, setGroups] = useState<FieldGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false)
  const [editingField, setEditingField] = useState<BasicField | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [groupSubmitting, setGroupSubmitting] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 })
  const [isDraggingDialog, setIsDraggingDialog] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const dialogStartPos = useRef({ x: 0, y: 0 })
  
  // 列设置相关
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false)
  const [tempColumnSettings, setTempColumnSettings] = useState<{ key: string; visible: boolean; frozen: boolean }[]>([])
  const [tempColumnOrder, setTempColumnOrder] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    fieldName: '',
    displayName: '',
    fieldCode: '',
    fieldType: 'text',
    isRequired: false,
    options: '',
    defaultValue: '',
    enabled: true,
    group: '',
    width: 100,
    columns: 1,
    columnWidth: 1,
    spacing: 2,
    rowIndex: 1,
    newRow: false,
    groupSortOrder: 0,
    // 自动生成相关
    autoGenerate: false,
    codeRuleId: null as number | null,
    codeRules: [] as Array<{ id: number; rule_name: string }>,
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

  // 默认列配置
  const defaultColumns = [
    { key: 'checkbox', label: '选择', flex: 0, width: 40, freezable: true },
    { key: 'index', label: '序号', flex: 0, width: 50, freezable: true },
    { key: 'group', label: '分组', flex: 1, freezable: true },
    { key: 'fieldName', label: '字段名称', flex: 1.5, freezable: true },
    { key: 'displayName', label: '显示名称', flex: 1, freezable: false },
    { key: 'fieldType', label: '类型', flex: 0.8, freezable: false },
    { key: 'width', label: '宽度', flex: 0.6, freezable: false },
    { key: 'columns', label: '列数', flex: 0.6, freezable: false },
    { key: 'columnWidth', label: '列宽', flex: 0.6, freezable: false },
    { key: 'spacing', label: '间距', flex: 0.6, freezable: false },
    { key: 'rowIndex', label: '行号', flex: 0.6, freezable: false },
    { key: 'groupSortOrder', label: '组内排序', flex: 0.8, freezable: false },
    { key: 'isRequired', label: '必选', flex: 0.5, freezable: false },
    { key: 'enabled', label: '启用', flex: 0.5, freezable: false },
    { key: 'newRow', label: '新行', flex: 0.5, freezable: false },
    { key: 'sort', label: '排序', flex: 0.8, freezable: false },
    { key: 'actions', label: '操作', flex: 0, width: 120, freezable: true },
  ]

  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumns.map(c => c.key))
  const [columnSettings, setColumnSettings] = useState([
    { key: 'checkbox', visible: true, frozen: true },
    { key: 'index', visible: true, frozen: false },
    { key: 'group', visible: true, frozen: false },
    { key: 'fieldName', visible: true, frozen: false },
    { key: 'displayName', visible: true, frozen: false },
    { key: 'fieldType', visible: true, frozen: false },
    { key: 'width', visible: false, frozen: false },
    { key: 'columns', visible: true, frozen: false },
    { key: 'columnWidth', visible: true, frozen: false },
    { key: 'spacing', visible: false, frozen: false },
    { key: 'rowIndex', visible: true, frozen: false },
    { key: 'groupSortOrder', visible: true, frozen: false },
    { key: 'isRequired', visible: true, frozen: false },
    { key: 'enabled', visible: true, frozen: false },
    { key: 'newRow', visible: true, frozen: false },
    { key: 'sort', visible: true, frozen: false },
    { key: 'actions', visible: true, frozen: true },
  ])

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchFields(), fetchGroups()])
    }
    loadData()
  }, [])

  // 初始化列设置
  useEffect(() => {
    const saved = localStorage.getItem('supplierBasicFieldColumnSettings')
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved)
        // 确保所有默认列都在设置中
        const mergedSettings = defaultColumns.map(col => {
          const savedSetting = savedSettings.find((s: any) => s.key === col.key)
          // 默认隐藏的列：width, spacing
          const defaultHiddenKeys = ['width', 'spacing']
          return savedSetting || { 
            key: col.key, 
            visible: !defaultHiddenKeys.includes(col.key), 
            frozen: col.key === 'checkbox' || col.key === 'actions' 
          }
        })
        setColumnSettings(mergedSettings)
        
        // 同步列顺序
        const savedOrder = localStorage.getItem('supplierBasicFieldColumnOrder')
        if (savedOrder) {
          const order = JSON.parse(savedOrder)
          const allKeys = new Set(defaultColumns.map(c => c.key))
          const validOrder = order.filter((k: string) => allKeys.has(k))
          const missingKeys = defaultColumns.filter(c => !validOrder.includes(c.key)).map(c => c.key)
          setColumnOrder([...validOrder, ...missingKeys])
        }
      } catch (e) {
        console.error('加载列设置失败:', e)
      }
    }
  }, [])

  // 保存列设置到 localStorage
  useEffect(() => {
    localStorage.setItem('supplierBasicFieldColumnSettings', JSON.stringify(columnSettings))
  }, [columnSettings])

  useEffect(() => {
    localStorage.setItem('supplierBasicFieldColumnOrder', JSON.stringify(columnOrder))
  }, [columnOrder])

  // 列设置处理函数
  const handleOpenColumnSettings = () => {
    setTempColumnSettings([...columnSettings])
    setTempColumnOrder([...columnOrder])
    setIsColumnSettingsOpen(true)
  }

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

  const handleMoveColumnUp = (key: string) => {
    const index = tempColumnOrder.indexOf(key)
    if (index > 0) {
      const newOrder = [...tempColumnOrder]
      newOrder.splice(index, 1)
      newOrder.splice(index - 1, 0, key)
      setTempColumnOrder(newOrder)
    }
  }

  const handleMoveColumnDown = (key: string) => {
    const index = tempColumnOrder.indexOf(key)
    if (index < tempColumnOrder.length - 1) {
      const newOrder = [...tempColumnOrder]
      newOrder.splice(index, 1)
      newOrder.splice(index + 1, 0, key)
      setTempColumnOrder(newOrder)
    }
  }

  const handleResetColumnSettings = () => {
    // 默认隐藏的列：width, spacing
    const defaultHiddenKeys = ['width', 'spacing']
    const defaultSettings = defaultColumns.map(col => ({
      key: col.key,
      visible: !defaultHiddenKeys.includes(col.key),
      frozen: col.key === 'checkbox' || col.key === 'actions',
    }))
    setTempColumnSettings(defaultSettings)
    setTempColumnOrder(defaultColumns.map(c => c.key))
    toast({
      title: '列设置已重置',
      description: '列显示、冻结设置已恢复为默认值',
    })
  }

  const handleSaveColumnSettings = () => {
    setColumnSettings(tempColumnSettings)
    setColumnOrder(tempColumnOrder)
    setIsColumnSettingsOpen(false)
    toast({
      title: '保存成功',
      description: '列设置已更新',
    })
  }

  const handleCancelColumnSettings = () => {
    setIsColumnSettingsOpen(false)
  }

  const fetchFields = async () => {
    try {
      const response = await fetch('/api/suppliers/basic-fields')
      const result = await response.json()
      if (result.data) {
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
      const response = await fetch('/api/suppliers/field-groups')
      const result = await response.json()
      if (result.data) {
        setGroups(result.data)
      }
    } catch (error) {
      console.error('获取分组列表失败:', error)
    }
  }

  const fetchCodeRules = async () => {
    try {
      const response = await fetch('/api/suppliers/code-rules')
      const result = await response.json()
      // API 返回的是 { data: [...] } 格式
      const rules = result.data || result
      if (rules) {
        setFormData(prev => ({
          ...prev,
          codeRules: Array.isArray(rules) ? rules : []
        }))
      }
    } catch (error) {
      console.error('获取编码规则列表失败:', error)
    }
  }

  const commonChineseMap: Record<string, string> = {
    '供应商名称': 'supplier_name',
    '联系人': 'contact',
    '电话': 'phone',
    '地址': 'address',
    '邮箱': 'email',
    '备注': 'remark',
    '银行账户': 'bank_account',
    '开户行': 'bank_name',
    '税号': 'tax_number',
    '传真': 'fax',
    '网址': 'website',
  }

  const generateFieldCode = (fieldName: string): string => {
    if (!fieldName) return ''
    
    if (commonChineseMap[fieldName]) {
      const baseCode = commonChineseMap[fieldName]
      // 检查是否已存在
      let code = baseCode
      let counter = 1
      while (fields.some(f => f.field_code === code && f.id !== editingField?.id)) {
        code = `${baseCode}_${counter}`
        counter++
      }
      return code
    }
    
    let result = fieldName.toLowerCase()
    result = result.replace(/[\s\-–—]+/g, '_')
    result = result.replace(/[^a-z0-9_]/g, '_')
    result = result.replace(/_{2,}/g, '_')
    result = result.replace(/^_+|_+$/g, '')
    
    if (/^[0-9]/.test(result)) {
      result = 'field_' + result
    }
    
    // 如果结果为空（纯中文字符），使用 field_ + 时间戳
    if (!result) {
      result = `field_${Date.now()}`
    }
    
    // 检查是否已存在，如果存在则添加数字后缀
    let finalCode = result
    let counter = 1
    while (fields.some(f => f.field_code === finalCode && f.id !== editingField?.id)) {
      finalCode = `${result}_${counter}`
      counter++
    }
    
    return finalCode
  }

  const calculateMaxRowIndex = (groupId: string) => {
    if (!groupId) return 0
    const groupFields = fields.filter(f => f.group_id === parseInt(groupId))
    if (groupFields.length === 0) return 0
    return Math.max(...groupFields.map(f => f.row_index || 1))
  }

  const filteredFields = useMemo(() => {
    return fields
      .filter(field => {
        if (selectedGroupId !== null) {
          if (field.group_id !== selectedGroupId) {
            return false
          }
        }

        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
          field.field_name.toLowerCase().includes(query) ||
          field.field_code.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => {
        const aGroupSortOrder = groups.find(g => g.id === a.group_id)?.sort_order ?? 999999
        const bGroupSortOrder = groups.find(g => g.id === b.group_id)?.sort_order ?? 999999
        if (aGroupSortOrder !== bGroupSortOrder) {
          return aGroupSortOrder - bGroupSortOrder
        }
        const aSortOrder = a.sort_order || 0
        const bSortOrder = b.sort_order || 0
        return aSortOrder - bSortOrder
      })
  }, [fields, groups, selectedGroupId, searchQuery])

  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = parseInt(active.id as string)
    const overId = parseInt(over.id as string)
    
    const activeIndex = groups.findIndex(g => g.id === activeId)
    const overIndex = groups.findIndex(g => g.id === overId)
    
    if (activeIndex === -1 || overIndex === -1) return
    
    const newGroups = [...groups]
    newGroups.splice(activeIndex, 1)
    newGroups.splice(overIndex, 0, groups[activeIndex])
    
    const updatedGroups = newGroups.map((group, index) => ({
      ...group,
      sort_order: index
    }))
    
    setGroups(updatedGroups)
    
    try {
      await Promise.all(
        updatedGroups.map((group) =>
          fetch(`/api/suppliers/field-groups/${group.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: group.name,
              sort_order: group.sort_order 
            }),
          })
        )
      )
      
      toast({
        title: '分组排序已更新',
        description: '分组顺序已保存',
      })
    } catch (error) {
      console.error('更新分组排序失败:', error)
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
      const response = await fetch('/api/suppliers/field-groups', {
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
      const response = await fetch(`/api/suppliers/field-groups/${groupId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchGroups()
        fetchFields()
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

  const handleGroupFilter = (groupId: number) => {
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null)
    } else {
      setSelectedGroupId(groupId)
    }
  }

  const handleUpdateGroupName = async (groupId: number, newName: string) => {
    if (!newName.trim()) {
      setEditingGroupId(null)
      setEditingGroupName('')
      return
    }

    try {
      const response = await fetch(`/api/suppliers/field-groups/${groupId}`, {
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

  const handleDialogDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingDialog(true)
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    dialogStartPos.current = { ...dialogPosition }

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y
      setDialogPosition({
        x: dialogStartPos.current.x + deltaX,
        y: dialogStartPos.current.y + deltaY,
      })
    }

    const handleMouseUp = () => {
      setIsDraggingDialog(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const resetDialogPosition = () => {
    setDialogPosition({ x: 0, y: 0 })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
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

      // 处理选项
      let options = null
      if (formData.fieldType === 'select') {
        if (formData.options && formData.options.trim()) {
          options = formData.options.split('\n').map((opt: string) => {
            const [label, value] = opt.split(':').map(s => s.trim())
            return { label: label || value, value: value || label }
          }).filter((opt: { label: string; value: string }) => opt.label && opt.value)
        }
      } else if (formData.fieldType === 'boolean') {
        options = [
          { label: '是', value: 'true' },
          { label: '否', value: 'false' }
        ]
      }

      const payload = {
        field_name: formData.fieldName,
        display_name: formData.displayName || formData.fieldName,
        field_code: formData.fieldCode || generateFieldCode(formData.fieldName),
        field_type: formData.fieldType,
        is_required: formData.isRequired,
        options,
        default_value: formData.defaultValue || null,
        enabled: formData.enabled,
        sort_order: editingField ? editingField.sort_order : fields.length,
        width: formData.width,
        columns: formData.columns,
        column_width: formData.columnWidth,
        spacing: formData.spacing,
        row_index: formData.rowIndex,
        new_row: formData.newRow,
        group_sort_order: formData.groupSortOrder,
        group_id: formData.group ? parseInt(formData.group) : null,
        group_name: formData.group ? groups.find(g => g.id === parseInt(formData.group))?.name : null,
        auto_generate: formData.autoGenerate,
        code_rule_id: formData.codeRuleId,
      }

      const url = editingField 
        ? `/api/suppliers/basic-fields/${editingField.id}`
        : '/api/suppliers/basic-fields'

      const response = await fetch(url, {
        method: editingField ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        fetchFields()
        resetForm()
        toast({
          title: editingField ? '更新成功' : '添加成功',
          description: editingField ? '字段已更新' : '字段已添加',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
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

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个字段吗？')) return
    
    try {
      const response = await fetch(`/api/suppliers/basic-fields/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchFields()
        toast({
          title: '删除成功',
          description: '字段已删除',
        })
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
    setFormData({
      fieldName: field.field_name,
      displayName: field.display_name || '',
      fieldCode: field.field_code,
      fieldType: field.field_type,
      isRequired: field.is_required,
      options: field.options 
        ? field.options.map((opt: any) => `${opt.label}:${opt.value}`).join('\n')
        : '',
      defaultValue: field.default_value || '',
      enabled: field.enabled !== false,
      group: field.group_id ? String(field.group_id) : '',
      width: field.width || 100,
      columns: field.columns || 1,
      columnWidth: field.column_width || 1,
      spacing: field.spacing || 2,
      rowIndex: field.row_index || 1,
      newRow: field.new_row || false,
      groupSortOrder: field.group_sort_order || 0,
      autoGenerate: field.auto_generate || false,
      codeRuleId: field.code_rule_id || null,
      codeRules: [],
    })
    // 如果开启了自动生成，获取编码规则列表
    if (field.auto_generate) {
      await fetchCodeRules()
    }
    setIsDialogOpen(true)
  }

  const handleToggleRequired = async (field: BasicField) => {
    try {
      const response = await fetch(`/api/suppliers/basic-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isRequired: !field.is_required,
        }),
      })
      
      if (response.ok) {
        fetchFields()
        toast({
          title: field.is_required ? '已取消必填' : '已设为必填',
          description: `字段"${field.field_name}"${field.is_required ? '不再是必填项' : '现在是必填项'}`,
        })
      }
    } catch (error) {
      console.error('切换必填状态失败:', error)
      toast({
        variant: 'destructive',
        title: '操作失败',
        description: '请重试',
      })
    }
  }

  const handleToggleEnabled = async (field: BasicField) => {
    try {
      const response = await fetch(`/api/suppliers/basic-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !field.enabled,
        }),
      })
      
      if (response.ok) {
        fetchFields()
        toast({
          title: field.enabled ? '已禁用' : '已启用',
          description: `字段"${field.field_name}"已${field.enabled ? '禁用' : '启用'}`,
        })
      }
    } catch (error) {
      console.error('切换状态失败:', error)
      toast({
        variant: 'destructive',
        title: '操作失败',
        description: '请重试',
      })
    }
  }

  const handleToggleNewRow = async (field: BasicField) => {
    try {
      const response = await fetch(`/api/suppliers/basic-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

  const moveFieldUp = async (index: number) => {
    if (index <= 0) return

    const currentField = filteredFields[index]
    const prevField = filteredFields[index - 1]
    
    if (!currentField || !prevField) return

    if (currentField.group_id !== prevField.group_id) {
      toast({
        variant: 'destructive',
        title: '无法移动',
        description: '只能在同一分组内调整顺序',
      })
      return
    }

    const currentSortOrder = currentField.sort_order || 0
    const prevSortOrder = prevField.sort_order || 0

    try {
      await Promise.all([
        fetch(`/api/suppliers/basic-fields/${currentField.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sort_order: prevSortOrder,
          }),
        }),
        fetch(`/api/suppliers/basic-fields/${prevField.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sort_order: currentSortOrder,
          }),
        }),
      ])
      
      fetchFields()
      toast({
        title: '排序已更新',
      })
    } catch (error) {
      console.error('更新字段排序失败:', error)
      toast({
        variant: 'destructive',
        title: '排序失败',
        description: '请重试',
      })
    }
  }

  const moveFieldDown = async (index: number) => {
    if (index >= filteredFields.length - 1) return

    const currentField = filteredFields[index]
    const nextField = filteredFields[index + 1]
    
    if (!currentField || !nextField) return

    if (currentField.group_id !== nextField.group_id) {
      toast({
        variant: 'destructive',
        title: '无法移动',
        description: '只能在同一分组内调整顺序',
      })
      return
    }

    const currentSortOrder = currentField.sort_order || 0
    const nextSortOrder = nextField.sort_order || 0

    try {
      await Promise.all([
        fetch(`/api/suppliers/basic-fields/${currentField.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sort_order: nextSortOrder,
          }),
        }),
        fetch(`/api/suppliers/basic-fields/${nextField.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sort_order: currentSortOrder,
          }),
        }),
      ])
      
      fetchFields()
      toast({
        title: '排序已更新',
      })
    } catch (error) {
      console.error('更新字段排序失败:', error)
      toast({
        variant: 'destructive',
        title: '排序失败',
        description: '请重试',
      })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredFields.map(f => f.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
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
          fetch(`/api/suppliers/basic-fields/${id}`, {
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
      width: 100,
      columns: 1,
      columnWidth: 1,
      spacing: 2,
      rowIndex: 1,
      newRow: false,
      groupSortOrder: 0,
      autoGenerate: false,
      codeRuleId: null,
      codeRules: [],
    })
    setEditingField(null)
  }

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: '文本',
      textarea: '文本多行',
      number: '数字',
      select: '单选',
      boolean: '布尔值',
      date: '日期',
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
        <TooltipProvider>
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
        </TooltipProvider>

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
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={selectedIds.size === 0}>
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
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

                {/* 分组选择 */}
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
                          width: { ...batchFormData.width, value: parseInt(e.target.value) || 100 } 
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
                          columns: { ...batchFormData.columns, value: parseInt(e.target.value) || 1 } 
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
                          spacing: { ...batchFormData.spacing, value: parseInt(e.target.value) || 2 } 
                        })}
                        min="0"
                        max="5"
                        disabled={!batchFormData.spacing.enabled}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* 行号 */}
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
                          rowIndex: { ...batchFormData.rowIndex, value: parseInt(e.target.value) || 1 } 
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
                          columnWidth: { ...batchFormData.columnWidth, value: parseInt(e.target.value) || 1 } 
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
                          groupSortOrder: { ...batchFormData.groupSortOrder, value: parseInt(e.target.value) || 0 } 
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
                  {/* 两列布局 */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {/* 分组 - 第一行左 */}
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

                    {/* 字段名称 - 第一行右 */}
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Label htmlFor="fieldName" className="text-xs text-gray-500">
                          字段名称 <span className="text-red-500">*</span>
                        </Label>
                        {editingField && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-gray-400 cursor-help">（不可修改）</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>字段名称用于标识字段，创建后不可修改。</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <Input
                        id="fieldName"
                        value={formData.fieldName}
                        onChange={(e) => {
                          const name = e.target.value
                          // 新建模式下：字段名称变化时，显示名称自动同步
                          if (!editingField) {
                            setFormData({ 
                              ...formData, 
                              fieldName: name,
                              fieldCode: generateFieldCode(name),
                              displayName: name,
                            })
                          }
                        }}
                        readOnly={!!editingField}
                        placeholder="例如：联系人"
                        className={`h-8 text-xs w-full ${editingField ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-200'}`}
                        required
                      />
                    </div>

                    {/* 显示名称 - 第二行左 */}
                    <div>
                      <Label htmlFor="displayName" className="text-xs text-gray-500 mb-1 block">显示名称</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="显示在页面上的名称"
                        className="h-8 text-xs bg-white border-gray-200 w-full"
                      />
                    </div>

                    {/* 字段代码 - 第二行右 */}
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Label htmlFor="fieldCode" className="text-xs text-gray-500">字段代码</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-gray-400 cursor-help">（自动生成）</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>字段代码用于存储供应商数据，自动生成不可修改。</p>
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

                    {/* 字段类型 - 第三行左 */}
                    <div>
                      <Label htmlFor="fieldType" className="text-xs text-gray-500 mb-1 block">字段类型</Label>
                      <Select
                        value={formData.fieldType}
                        onValueChange={(value) => setFormData({ ...formData, fieldType: value })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text" className="text-xs">文本</SelectItem>
                          <SelectItem value="number" className="text-xs">数字</SelectItem>
                          <SelectItem value="select" className="text-xs">单选</SelectItem>
                          <SelectItem value="boolean" className="text-xs">布尔值</SelectItem>
                          <SelectItem value="textarea" className="text-xs">多行文本</SelectItem>
                          <SelectItem value="date" className="text-xs">日期</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 默认值 - 第三行右 */}
                    <div>
                      <Label htmlFor="defaultValue" className="text-xs text-gray-500 mb-1 block">默认值</Label>
                      <Input
                        id="defaultValue"
                        value={formData.defaultValue}
                        onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                        placeholder="选填"
                        className="h-8 text-xs bg-white border-gray-200"
                      />
                    </div>
                  </div>

                  {/* 选项配置 - 仅在选择类型时显示 */}
                  {formData.fieldType === 'select' && (
                    <div className="mt-2 space-y-2">
                      <div>
                        <Label htmlFor="options" className="text-xs text-gray-500 mb-1 block">选项配置</Label>
                        <textarea
                          id="options"
                          className="flex w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"
                          value={formData.options}
                          onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                          placeholder="每行一个选项，格式：标签:值&#10;例如：&#10;是:yes&#10;否:no"
                        />
                      </div>
                    </div>
                  )}

                  {/* 开关设置 */}
                  <div className="flex items-center gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        id="isRequired"
                        checked={formData.isRequired}
                        onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked as boolean })}
                        className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />
                      <span className="text-xs text-gray-600">必填字段</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        id="enabled"
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                        className="data-[state=checked]:bg-green-500 scale-75"
                      />
                      <span className="text-xs text-gray-600">启用字段</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        id="newRow"
                        checked={formData.newRow}
                        onCheckedChange={(checked) => setFormData({ ...formData, newRow: checked })}
                        className="data-[state=checked]:bg-blue-500 scale-75"
                      />
                      <span className="text-xs text-gray-600">新行</span>
                    </label>
                  </div>

                  {/* 自动生成设置 - 仅在文本类型时显示 */}
                  {formData.fieldType === 'text' && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <div className="flex items-center justify-between mb-2">
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
                        <div className="mt-2">
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
                                  暂无编码规则，请先在"编码规则"页面创建
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 布局设置 */}
                <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                  <div className="text-xs font-medium text-gray-600 mb-2">布局设置</div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* 宽度 */}
                    <div>
                      <Label htmlFor="width" className="text-xs text-gray-500 mb-1 block">宽度 (%)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={formData.width}
                        onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 100 })}
                        min="10"
                        max="100"
                        className="h-8 text-xs bg-white border-gray-200"
                      />
                    </div>
                    {/* 列数 */}
                    <div>
                      <Label htmlFor="columns" className="text-xs text-gray-500 mb-1 block">列数</Label>
                      <Input
                        id="columns"
                        type="number"
                        value={formData.columns}
                        onChange={(e) => setFormData({ ...formData, columns: parseInt(e.target.value) || 1 })}
                        min="1"
                        max="12"
                        className="h-8 text-xs bg-white border-gray-200"
                      />
                    </div>
                    {/* 列宽 */}
                    <div>
                      <Label htmlFor="columnWidth" className="text-xs text-gray-500 mb-1 block">列宽</Label>
                      <Input
                        id="columnWidth"
                        type="number"
                        value={formData.columnWidth}
                        onChange={(e) => setFormData({ ...formData, columnWidth: parseInt(e.target.value) || 1 })}
                        min="1"
                        max="12"
                        className="h-8 text-xs bg-white border-gray-200"
                      />
                    </div>
                    {/* 间距 */}
                    <div>
                      <Label htmlFor="spacing" className="text-xs text-gray-500 mb-1 block">间距</Label>
                      <Input
                        id="spacing"
                        type="number"
                        value={formData.spacing}
                        onChange={(e) => setFormData({ ...formData, spacing: parseInt(e.target.value) || 2 })}
                        min="0"
                        max="12"
                        className="h-8 text-xs bg-white border-gray-200"
                      />
                    </div>
                    {/* 行号 */}
                    <div>
                      <Label htmlFor="rowIndex" className="text-xs text-gray-500 mb-1 block">行号</Label>
                      <Input
                        id="rowIndex"
                        type="number"
                        value={formData.rowIndex}
                        onChange={(e) => setFormData({ ...formData, rowIndex: parseInt(e.target.value) || 1 })}
                        min="1"
                        className="h-8 text-xs bg-white border-gray-200"
                      />
                    </div>
                    {/* 组内排序 */}
                    <div>
                      <Label htmlFor="groupSortOrder" className="text-xs text-gray-500 mb-1 block">组内排序</Label>
                      <Input
                        id="groupSortOrder"
                        type="number"
                        value={formData.groupSortOrder}
                        onChange={(e) => setFormData({ ...formData, groupSortOrder: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="h-8 text-xs bg-white border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="px-4 py-2.5 border-t border-gray-100 flex-shrink-0">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)} className="h-8 text-xs px-4">
                  取消
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs px-4 bg-blue-500 hover:bg-blue-600">
                  {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  保存
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 列设置对话框 */}
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
                    
                    const isFixed = colKey === 'checkbox' || colKey === 'actions'

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
      </div>

      {/* Table Container */}
      <div 
        className="bg-white"
        style={{
          borderRadius: 'var(--card-radius)',
          borderWidth: 'var(--card-border-width)',
          borderColor: 'var(--border-color)',
          borderStyle: 'solid',
          overflow: 'hidden'
        }}
      >
        <div className="flex">
          {/* 左侧主表格 */}
          <div className="flex-1 overflow-x-auto">
            {/* 表头 */}
            <div className="flex items-center bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 h-10">
              {columnOrder.map((colKey) => {
                const column = defaultColumns.find(c => c.key === colKey)
                const setting = columnSettings.find(s => s.key === colKey)
                if (!column || !setting?.visible) return null
                // 跳过操作列，在固定区域单独渲染
                if (colKey === 'actions') return null

                // flex 为 0 表示固定宽度，否则使用 flex 比例
                const headerStyle: React.CSSProperties = column.flex === 0 && column.width
                  ? { width: `${column.width}px`, flexShrink: 0 }
                  : { flex: column.flex }

                return (
                  <div
                    key={colKey}
                    className={`flex items-center justify-center ${colKey === 'checkbox' ? 'pl-4 pr-2' : 'px-2'}`}
                    style={headerStyle}
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
                    {colKey === 'groupSortOrder' && <span>组内排序</span>}
                    {colKey === 'isRequired' && <span>必选</span>}
                    {colKey === 'enabled' && <span>启用</span>}
                    {colKey === 'newRow' && <span>新行</span>}
                    {colKey === 'sort' && <span>排序</span>}
                  </div>
                )
              })}
            </div>

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
                            <span className="text-sm text-gray-600 truncate">
                              {field.group?.name || field.group_name || '-'}
                            </span>
                          )}
                          {colKey === 'fieldName' && (
                            <span className="text-sm font-medium text-gray-900 px-1 truncate">{field.field_name}</span>
                          )}
                          {colKey === 'displayName' && (
                            <span className="text-sm text-gray-700 px-1 truncate">{field.display_name || field.field_name}</span>
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
                          {colKey === 'groupSortOrder' && (
                            <span className="text-sm text-gray-600">{field.group_sort_order}</span>
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
                              onCheckedChange={() => handleToggleEnabled(field)}
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
                                disabled={index === 0 || filteredFields[index - 1]?.group_id !== field.group_id}
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                                onClick={() => moveFieldDown(index)}
                                disabled={index >= filteredFields.length - 1 || filteredFields[index + 1]?.group_id !== field.group_id}
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
