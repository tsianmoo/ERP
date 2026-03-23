'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Loader2, Search, GripVertical, Settings2, Type, LayoutGrid } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable
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
  field_group: {
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
      className={`flex items-center gap-2 border px-3 py-1.5 rounded-sm cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-blue-300'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      } ${isDragging ? 'shadow-lg' : ''}`}
      onClick={onSelect}
    >
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

export default function SupplierBasicInfoPage() {
  const [fields, setFields] = useState<BasicField[]>([])
  const [groups, setGroups] = useState<FieldGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<BasicField | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [groupSubmitting, setGroupSubmitting] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')
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

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchFields(), fetchGroups()])
    }
    loadData()
  }, [])

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

  // 常用词汇映射
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

  // 自动生成数据库字段名
  const generateFieldCode = (fieldName: string): string => {
    if (!fieldName) return ''
    
    if (commonChineseMap[fieldName]) {
      return commonChineseMap[fieldName]
    }
    
    let result = fieldName.toLowerCase()
    result = result.replace(/[\s\-–—]+/g, '_')
    result = result.replace(/[^a-z0-9_]/g, '_')
    result = result.replace(/_{2,}/g, '_')
    result = result.replace(/^_+|_+$/g, '')
    
    if (/^[0-9]/.test(result)) {
      result = 'field_' + result
    }
    
    return result || 'custom_field'
  }

  // 按分组和排序过滤字段
  const filteredFields = useMemo(() => {
    let result = [...fields]
    
    // 按分组筛选
    if (selectedGroupId !== null) {
      result = result.filter(f => f.group_id === selectedGroupId)
    }
    
    // 按搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(f => 
        f.field_name.toLowerCase().includes(query) ||
        (f.display_name && f.display_name.toLowerCase().includes(query)) ||
        f.field_code.toLowerCase().includes(query)
      )
    }
    
    // 排序：先按分组排序，再按字段排序
    result.sort((a, b) => {
      const aGroupSort = a.group_sort_order || 0
      const bGroupSort = b.group_sort_order || 0
      if (aGroupSort !== bGroupSort) {
        return aGroupSort - bGroupSort
      }
      return a.sort_order - b.sort_order
    })
    
    return result
  }, [fields, selectedGroupId, searchQuery])

  // 分组拖拽处理
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
              sortOrder: group.sort_order 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      let options = null
      if (formData.fieldType === 'select') {
        options = formData.options.split('\n').map((opt: string) => {
          const [label, value] = opt.split(':').map(s => s.trim())
          return { label: label || value, value: value || label }
        })
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

  const handleEdit = (field: BasicField) => {
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
    })
    setIsDialogOpen(true)
  }

  // 切换启用状态
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

  // 上移下移
  const handleMoveUp = async (field: BasicField, index: number) => {
    if (index === 0) return
    
    const prevField = filteredFields[index - 1]
    
    await Promise.all([
      fetch(`/api/suppliers/basic-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: prevField.sort_order }),
      }),
      fetch(`/api/suppliers/basic-fields/${prevField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: field.sort_order }),
      }),
    ])
    
    fetchFields()
  }

  const handleMoveDown = async (field: BasicField, index: number) => {
    if (index === filteredFields.length - 1) return
    
    const nextField = filteredFields[index + 1]
    
    await Promise.all([
      fetch(`/api/suppliers/basic-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: nextField.sort_order }),
      }),
      fetch(`/api/suppliers/basic-fields/${nextField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: field.sort_order }),
      }),
    ])
    
    fetchFields()
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
    })
    setEditingField(null)
  }

  // 字段类型映射
  const fieldTypeMap: Record<string, string> = {
    text: '文本',
    number: '数字',
    select: '单选',
    boolean: '布尔值',
    textarea: '多行文本',
    date: '日期',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">基本信息管理</h1>
        <p className="text-gray-600 text-sm">配置供应商基本信息字段，支持分组管理和拖拽排序</p>
      </div>

      <div className="flex gap-6">
        {/* 左侧分组列表 */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">分组</span>
              <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>添加分组</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="groupName">分组名称</Label>
                      <Input
                        id="groupName"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="请输入分组名称"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleAddGroup} disabled={groupSubmitting}>
                      {groupSubmitting ? '添加中...' : '添加'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* 全部选项 */}
            <div
              className={`flex items-center gap-2 border px-3 py-1.5 rounded-sm cursor-pointer transition-colors mb-2 ${
                selectedGroupId === null
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedGroupId(null)}
            >
              <span className="text-sm text-gray-700">全部</span>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
              <SortableContext items={groups.map(g => g.id.toString())}>
                <div className="space-y-1">
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
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1">
          {/* 搜索和操作栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索字段..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingField(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加字段
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingField ? '编辑字段' : '添加字段'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <Label htmlFor="fieldName">字段名称 <span className="text-red-500">*</span></Label>
                      <Input
                        id="fieldName"
                        value={formData.fieldName}
                        onChange={(e) => {
                          const name = e.target.value
                          setFormData({ 
                            ...formData, 
                            fieldName: name,
                            fieldCode: formData.fieldCode || generateFieldCode(name),
                            displayName: formData.displayName || name,
                          })
                        }}
                        placeholder="例如：联系人"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="displayName">显示名称</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="显示在页面上的名称"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fieldCode">字段代码 <span className="text-red-500">*</span></Label>
                      <Input
                        id="fieldCode"
                        value={formData.fieldCode}
                        onChange={(e) => setFormData({ ...formData, fieldCode: e.target.value })}
                        placeholder="例如：contact"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="group">所属分组</Label>
                      <Select
                        value={formData.group}
                        onValueChange={(value) => setFormData({ ...formData, group: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择分组" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={String(group.id)}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="fieldType">字段类型</Label>
                      <Select
                        value={formData.fieldType}
                        onValueChange={(value) => setFormData({ ...formData, fieldType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">文本</SelectItem>
                          <SelectItem value="number">数字</SelectItem>
                          <SelectItem value="select">单选</SelectItem>
                          <SelectItem value="boolean">布尔值</SelectItem>
                          <SelectItem value="textarea">多行文本</SelectItem>
                          <SelectItem value="date">日期</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.fieldType === 'select' && (
                      <div>
                        <Label htmlFor="options">选项（每行一个，格式：标签:值）</Label>
                        <textarea
                          id="options"
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                          value={formData.options}
                          onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                          placeholder="是:yes&#10;否:no"
                        />
                      </div>
                    )}
                    {formData.fieldType === 'boolean' && (
                      <div>
                        <Label htmlFor="defaultValue">默认值</Label>
                        <Select
                          value={formData.defaultValue}
                          onValueChange={(value) => setFormData({ ...formData, defaultValue: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择默认值" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">是</SelectItem>
                            <SelectItem value="false">否</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isRequired"
                        checked={formData.isRequired}
                        onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked as boolean })}
                      />
                      <Label htmlFor="isRequired">必填字段</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                      />
                      <Label htmlFor="enabled">启用字段</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      取消
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? '保存中...' : '保存'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* 字段列表 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">序号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分组</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">字段名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">显示名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">字段类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">必填</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">启用</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">排序</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFields.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? '没有找到匹配的字段' : '暂无字段配置，请添加字段'}
                    </td>
                  </tr>
                ) : (
                  filteredFields.map((field, index) => (
                    <tr key={field.id} className={`hover:bg-gray-50 ${!field.enabled ? 'bg-gray-100 opacity-60' : ''}`}>
                      <td className="px-4 py-4">
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                      </td>
                      <td className="px-4 py-4 text-gray-600">{index + 1}</td>
                      <td className="px-4 py-4 text-gray-600">{field.field_group?.name || field.group_name || '-'}</td>
                      <td className="px-4 py-4 font-medium text-gray-900">{field.field_name}</td>
                      <td className="px-4 py-4 text-gray-600">{field.display_name || field.field_name}</td>
                      <td className="px-4 py-4 text-gray-600">{fieldTypeMap[field.field_type] || field.field_type}</td>
                      <td className="px-4 py-4">
                        {field.is_required ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            必填
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            可选
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Switch
                          checked={field.enabled !== false}
                          onCheckedChange={() => handleToggleEnabled(field)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveUp(field, index)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveDown(field, index)}
                            disabled={index === filteredFields.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(field)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(field.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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
    </div>
  )
}
