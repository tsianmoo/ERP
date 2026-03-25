'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Loader2, Search, GripVertical, Settings2, Type, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  field_code: string
  sort_order: number
  code_length: number
  enabled: boolean
  field_type?: string // single_select, text
  supplier_attribute_values?: AttributeValue[]
  width: number
  columns: number
  column_width: number
  spacing: number
  row_index: number
  new_row: boolean
  group_sort_order: number
  is_required: boolean
  group_id: number | null
  supplier_attribute_groups?: { id: number; name: string } | null
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
  const allValues = attribute.supplier_attribute_values || []

  if (allValues.length === 0) {
    return <div className="py-8 text-center"><p className="text-sm text-gray-400">暂无属性值，点击"添加值"添加</p></div>
  }

  return (
    <>
      <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs">
        <span className="w-8 text-gray-500"></span>
        <span className="w-8 text-gray-500 text-center">序号</span>
        <span className="w-16 text-gray-500 text-center">排序</span>
        <span className="flex-1 text-gray-500">属性名</span>
        <span className="w-20 text-gray-500 text-center">编码</span>
        <span className="w-24 text-gray-500 text-center">操作</span>
      </div>
      <div className="divide-y divide-gray-50">
        {allValues.map((value, originalIndex) => (
          <div key={value.id} className="flex items-center gap-1 px-4 py-2.5 hover:bg-gray-50 transition-colors">
            <div className="w-8 flex justify-center">
              <GripVertical className="h-4 w-4 text-gray-300 cursor-move" />
            </div>
            <span className="w-8 text-sm text-gray-600 text-center">{originalIndex + 1}</span>
            <div className="w-16 flex items-center justify-center gap-0.5">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700" onClick={() => onMoveUp(attribute.id, originalIndex)} disabled={originalIndex === 0}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700" onClick={() => onMoveDown(attribute.id, originalIndex)} disabled={originalIndex >= allValues.length - 1}>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            <span className="flex-1 text-sm text-gray-900">{value.name}</span>
            <div className="w-20 flex justify-center">
              <Badge variant="outline" className="text-sm font-mono">{value.code}</Badge>
            </div>
            <div className="w-24 flex items-center justify-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900" onClick={() => onEdit(value)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>编辑</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-600 hover:text-red-600" onClick={() => onDelete(value.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>删除</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </>
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-2 border px-3 py-1.5 rounded-sm cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
      } ${isDragging ? 'shadow-lg' : ''}`}
      onClick={onSelect}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
        <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
      </div>
      {isEditing ? (
        <input type="text" value={editingName} onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onEditSubmit(); else if (e.key === 'Escape') onEditCancel() }}
          onBlur={onEditSubmit} onClick={(e) => e.stopPropagation()} autoFocus
          className="w-24 px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
      ) : (
        <span className="text-sm text-gray-700">{group.name}</span>
      )}
      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onEdit() }}>
        <Edit className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete() }}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

const commonChineseMap: Record<string, string> = {
  '供应商名称': 'supplier_name', '供应商': 'supplier', '名称': 'name', '品牌': 'brand',
  '类型': 'type', '级别': 'level', '等级': 'grade', '分类': 'category',
  '地区': 'region', '状态': 'status', '备注': 'remark', '描述': 'description',
}

const generateFieldCode = (fieldName: string): string => {
  if (!fieldName) return ''
  let result = fieldName.trim()
  for (const [chinese, english] of Object.entries(commonChineseMap)) {
    if (result === chinese) return english
    result = result.replace(new RegExp(chinese, 'g'), english)
  }
  result = result.toLowerCase().replace(/[\s\-–—]+/g, '_').replace(/[^a-z0-9_]/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '')
  if (/^[0-9]/.test(result)) result = 'field_' + result
  if (!result) result = 'custom_field'
  return result
}

export default function SupplierAttributesPage() {
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
  const [formData, setFormData] = useState({ name: '', fieldCode: '', codeLength: 2, enabled: true, isRequired: false, group: '', width: 100, columns: 1, columnWidth: 1, spacing: 2, rowIndex: 1, newRow: false, groupSortOrder: 0, fieldType: 'single_select' })
  const [editFormData, setEditFormData] = useState({ name: '', fieldCode: '', codeLength: 2, enabled: true, width: 100, columns: 1, columnWidth: 1, spacing: 2, rowIndex: 1, newRow: false, groupSortOrder: 0, isRequired: false, group: '', fieldType: 'single_select' })
  const [valueFormData, setValueFormData] = useState({ name: '', code: '', parentId: null as number | null })
  const { toast } = useToast()

  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([])
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [groupSubmitting, setGroupSubmitting] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false)
  const [batchFormData, setBatchFormData] = useState({
    group: { value: '', enabled: false }, width: { value: 100, enabled: false }, columns: { value: 1, enabled: false },
    columnWidth: { value: 1, enabled: false }, spacing: { value: 2, enabled: false }, rowIndex: { value: 1, enabled: false },
    groupSortOrder: { value: 0, enabled: false }, isRequired: { value: false, enabled: false },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    Promise.all([fetchAttributes(), fetchAttributeGroups()])
  }, [])

  const fetchAttributeGroups = async () => {
    try {
      const response = await fetch('/api/suppliers/attribute-groups')
      const result = await response.json()
      if (result.data) setAttributeGroups(result.data)
    } catch (error) { console.error('获取分组列表失败:', error) }
  }

  const fetchAttributes = async () => {
    try {
      const response = await fetch('/api/suppliers/attributes')
      const result = await response.json()
      if (result.data) {
        const sortedData = result.data
          .map((attr: Attribute) => ({ ...attr, supplier_attribute_values: (attr.supplier_attribute_values || []).sort((a: AttributeValue, b: AttributeValue) => a.sort_order - b.sort_order) }))
          .sort((a: Attribute, b: Attribute) => a.sort_order - b.sort_order)
        setAttributes(sortedData)
        return sortedData
      }
    } catch (error) {
      console.error('获取属性列表失败:', error)
      toast({ variant: 'destructive', title: '加载失败', description: '无法加载属性列表' })
    } finally { setLoading(false) }
  }

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { group, ...bodyData } = formData
      const maxSortOrder = attributes.length > 0 ? Math.max(...attributes.map(a => a.sort_order)) : -1
      const requestBody: any = { ...bodyData, sortOrder: maxSortOrder + 1 }
      if (group && group.trim() !== '') {
        const parsedId = parseInt(group, 10)
        if (!isNaN(parsedId)) requestBody.group_id = parsedId
      }
      const response = await fetch('/api/suppliers/attributes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) })
      if (response.ok) {
        setIsDialogOpen(false)
        fetchAttributes()
        setFormData({ name: '', fieldCode: '', codeLength: 2, enabled: true, isRequired: false, group: '', width: 100, columns: 1, columnWidth: 1, spacing: 2, rowIndex: 1, newRow: false, groupSortOrder: 0, fieldType: 'single_select' })
        toast({ title: '添加成功', description: '属性分类已添加' })
      } else { const error = await response.json(); throw new Error(error.error || '添加失败') }
    } catch (error) {
      console.error('添加属性失败:', error)
      toast({ variant: 'destructive', title: '添加失败', description: error instanceof Error ? error.message : '请重试' })
    } finally { setSubmitting(false) }
  }

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) { toast({ variant: 'destructive', title: '请输入分组名称' }); return }
    setGroupSubmitting(true)
    try {
      const response = await fetch('/api/suppliers/attribute-groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newGroupName.trim() }) })
      if (response.ok) {
        setNewGroupName(''); setIsGroupDialogOpen(false); fetchAttributeGroups()
        toast({ title: '添加成功', description: '分组已添加' })
      } else { const error = await response.json(); throw new Error(error.error || '添加失败') }
    } catch (error) {
      console.error('添加分组失败:', error)
      toast({ variant: 'destructive', title: '添加失败', description: error instanceof Error ? error.message : '请重试' })
    } finally { setGroupSubmitting(false) }
  }

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!confirm(`确定要删除分组"${groupName}"吗？`)) return
    try {
      const response = await fetch(`/api/suppliers/attribute-groups/${groupId}`, { method: 'DELETE' })
      if (response.ok) {
        fetchAttributeGroups(); fetchAttributes()
        if (selectedGroupId === groupId) setSelectedGroupId(null)
        toast({ title: '删除成功', description: '分组已删除' })
      } else { const error = await response.json(); throw new Error(error.error || '删除失败') }
    } catch (error) {
      console.error('删除分组失败:', error)
      toast({ variant: 'destructive', title: '删除失败', description: error instanceof Error ? error.message : '请重试' })
    }
  }

  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeId = parseInt(active.id as string), overId = parseInt(over.id as string)
    const activeIndex = attributeGroups.findIndex(g => g.id === activeId), overIndex = attributeGroups.findIndex(g => g.id === overId)
    if (activeIndex === -1 || overIndex === -1) return
    const newGroups = [...attributeGroups]; newGroups.splice(activeIndex, 1); newGroups.splice(overIndex, 0, attributeGroups[activeIndex])
    const updatedGroups = newGroups.map((group, index) => ({ ...group, sort_order: index }))
    setAttributeGroups(updatedGroups)
    try {
      await Promise.all(updatedGroups.map((group) => fetch(`/api/suppliers/attribute-groups/${group.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: group.name, sortOrder: group.sort_order }) })))
      toast({ title: '分组排序已更新' })
    } catch (error) { console.error('更新分组排序失败:', error); fetchAttributeGroups() }
  }

  const handleUpdateGroupName = async (groupId: number, newName: string) => {
    if (!newName.trim()) { setEditingGroupId(null); setEditingGroupName(''); return }
    try {
      const response = await fetch(`/api/suppliers/attribute-groups/${groupId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }) })
      if (response.ok) { fetchAttributeGroups(); fetchAttributes(); toast({ title: '更新成功' }) }
      else { const error = await response.json(); throw new Error(error.error || '更新失败') }
    } catch (error) { console.error('更新分组名称失败:', error); toast({ variant: 'destructive', title: '更新失败' }) }
    finally { setEditingGroupId(null); setEditingGroupName('') }
  }

  const handleSelectAll = (checked: boolean) => { setSelectedIds(checked ? new Set(attributes.map(a => a.id)) : new Set()) }
  const handleToggleSelect = (id: number) => { const newSelected = new Set(selectedIds); if (newSelected.has(id)) newSelected.delete(id); else newSelected.add(id); setSelectedIds(newSelected) }

  const handleBatchEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIds.size === 0) { toast({ variant: 'destructive', title: '请选择属性' }); return }
    const updateData: any = {}
    if (batchFormData.group.enabled) updateData.group_id = batchFormData.group.value && batchFormData.group.value !== "none" ? parseInt(batchFormData.group.value) : null
    if (batchFormData.width.enabled) updateData.width = batchFormData.width.value
    if (batchFormData.columns.enabled) updateData.columns = batchFormData.columns.value
    if (batchFormData.columnWidth.enabled) updateData.column_width = batchFormData.columnWidth.value
    if (batchFormData.spacing.enabled) updateData.spacing = batchFormData.spacing.value
    if (batchFormData.rowIndex.enabled) updateData.row_index = batchFormData.rowIndex.value
    if (batchFormData.groupSortOrder.enabled) updateData.group_sort_order = batchFormData.groupSortOrder.value
    if (batchFormData.isRequired.enabled) updateData.is_required = batchFormData.isRequired.value
    try {
      await Promise.all(Array.from(selectedIds).map(id => fetch(`/api/suppliers/attributes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) })))
      setSelectedIds(new Set()); fetchAttributes(); setIsBatchEditOpen(false)
      toast({ title: '批量更新成功' })
    } catch (error) { console.error('批量更新失败:', error); toast({ variant: 'destructive', title: '批量更新失败' }) }
  }

  const handleEditAttribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAttribute) return
    setSubmitting(true)
    try {
      const { group, ...bodyData } = editFormData
      const requestBody: any = { ...bodyData }
      if (group && group.trim() !== '') { const parsedId = parseInt(group, 10); if (!isNaN(parsedId)) requestBody.group_id = parsedId }
      const response = await fetch(`/api/suppliers/attributes/${editingAttribute.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) })
      if (response.ok) {
        setIsEditDialogOpen(false); fetchAttributes(); setEditingAttribute(null)
        setEditFormData({ name: '', fieldCode: '', codeLength: 2, enabled: true, width: 100, columns: 1, columnWidth: 1, spacing: 2, rowIndex: 1, newRow: false, groupSortOrder: 0, isRequired: false, group: '', fieldType: 'single_select' })
        toast({ title: '更新成功' })
      } else { const error = await response.json(); throw new Error(error.error || '更新失败') }
    } catch (error) { console.error('更新属性失败:', error); toast({ variant: 'destructive', title: '更新失败' }) }
    finally { setSubmitting(false) }
  }

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault()
    const attribute = selectedAttribute || managingAttribute
    if (!attribute) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/suppliers/attribute-values', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...valueFormData, attributeId: attribute.id }) })
      if (response.ok) {
        setIsValueDialogOpen(false)
        const updatedAttributes = await fetchAttributes()
        if (managingAttribute && updatedAttributes) { const updated = updatedAttributes.find((a: Attribute) => a.id === managingAttribute.id); if (updated) setManagingAttribute(updated) }
        setValueFormData({ name: '', code: '', parentId: null })
        toast({ title: '添加成功' })
      } else { const error = await response.json(); throw new Error(error.error || '添加失败') }
    } catch (error) { console.error('添加属性值失败:', error); toast({ variant: 'destructive', title: '添加失败' }) }
    finally { setSubmitting(false) }
  }

  const handleEditValue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingValue) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/suppliers/attribute-values/${editingValue.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: valueFormData.name, code: valueFormData.code }) })
      if (response.ok) {
        setIsEditValueDialogOpen(false)
        const updatedAttributes = await fetchAttributes()
        if (managingAttribute && updatedAttributes) { const updated = updatedAttributes.find((a: Attribute) => a.id === managingAttribute.id); if (updated) setManagingAttribute(updated) }
        setEditingValue(null); setValueFormData({ name: '', code: '', parentId: null })
        toast({ title: '更新成功' })
      } else { const error = await response.json(); throw new Error(error.error || '更新失败') }
    } catch (error) { console.error('更新属性值失败:', error); toast({ variant: 'destructive', title: '更新失败' }) }
    finally { setSubmitting(false) }
  }

  const handleDeleteAttribute = async (id: number) => {
    if (!confirm('确定要删除这个属性分类吗？')) return
    try {
      const response = await fetch(`/api/suppliers/attributes/${id}`, { method: 'DELETE' })
      if (response.ok) { setAttributes(attributes.filter(a => a.id !== id)); toast({ title: '删除成功' }) }
      else throw new Error('删除失败')
    } catch (error) { console.error('删除属性失败:', error); toast({ variant: 'destructive', title: '删除失败' }) }
  }

  const handleDeleteValue = async (id: number) => {
    if (!confirm('确定要删除这个属性值吗？')) return
    try {
      const response = await fetch(`/api/suppliers/attribute-values/${id}`, { method: 'DELETE' })
      if (response.ok) {
        const updatedAttributes = await fetchAttributes()
        if (managingAttribute && updatedAttributes) { const updated = updatedAttributes.find((a: Attribute) => a.id === managingAttribute.id); if (updated) setManagingAttribute(updated) }
        toast({ title: '删除成功' })
      } else throw new Error('删除失败')
    } catch (error) { console.error('删除属性值失败:', error); toast({ variant: 'destructive', title: '删除失败' }) }
  }

  const moveValueUp = async (attributeId: number, valueIndex: number) => {
    const attribute = attributes.find(a => a.id === attributeId)
    if (!attribute || !attribute.supplier_attribute_values || valueIndex <= 0) return
    const values = [...attribute.supplier_attribute_values]
    const temp = values[valueIndex]; values[valueIndex] = values[valueIndex - 1]; values[valueIndex - 1] = temp
    await updateSortOrders(values)
  }

  const moveValueDown = async (attributeId: number, valueIndex: number) => {
    const attribute = attributes.find(a => a.id === attributeId)
    if (!attribute || !attribute.supplier_attribute_values || valueIndex >= attribute.supplier_attribute_values.length - 1) return
    const values = [...attribute.supplier_attribute_values]
    const temp = values[valueIndex]; values[valueIndex] = values[valueIndex + 1]; values[valueIndex + 1] = temp
    await updateSortOrders(values)
  }

  const updateSortOrders = async (values: AttributeValue[]) => {
    try {
      await Promise.all(values.map((value, index) => fetch(`/api/suppliers/attribute-values/${value.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value.name, code: value.code, sortOrder: index }) })))
      const updatedAttributes = await fetchAttributes()
      if (managingAttribute && updatedAttributes) { const updated = updatedAttributes.find((a: Attribute) => a.id === managingAttribute.id); if (updated) setManagingAttribute(updated) }
    } catch (error) { console.error('更新排序失败:', error); toast({ variant: 'destructive', title: '排序失败' }) }
  }

  const handleToggleAttribute = async (attribute: Attribute) => {
    try {
      const response = await fetch(`/api/suppliers/attributes/${attribute.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: attribute.name, code: attribute.code, codeLength: attribute.code_length, enabled: !attribute.enabled }) })
      if (response.ok) { fetchAttributes(); toast({ title: attribute.enabled ? '已禁用' : '已启用' }) }
      else throw new Error('操作失败')
    } catch (error) { console.error('切换启用状态失败:', error); toast({ variant: 'destructive', title: '操作失败' }) }
  }

  const handleToggleRequired = async (attribute: Attribute) => {
    try {
      const response = await fetch(`/api/suppliers/attributes/${attribute.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: attribute.name, code: attribute.code, codeLength: attribute.code_length, isRequired: !attribute.is_required }) })
      if (response.ok) { fetchAttributes(); toast({ title: attribute.is_required ? '已设为可选' : '已设为必选' }) }
      else throw new Error('操作失败')
    } catch (error) { console.error('切换必选状态失败:', error); toast({ variant: 'destructive', title: '操作失败' }) }
  }

  const handleToggleNewRow = async (attribute: Attribute) => {
    try {
      const response = await fetch(`/api/suppliers/attributes/${attribute.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: attribute.name, code: attribute.code, codeLength: attribute.code_length, newRow: !attribute.new_row }) })
      if (response.ok) { fetchAttributes(); toast({ title: attribute.new_row ? '已取消新行' : '已设为新行' }) }
      else throw new Error('操作失败')
    } catch (error) { console.error('切换新行状态失败:', error); toast({ variant: 'destructive', title: '操作失败' }) }
  }

  const moveAttributeUp = async (index: number) => {
    if (index <= 0) return
    const newAttributes = [...attributes]; const temp = newAttributes[index]; newAttributes[index] = newAttributes[index - 1]; newAttributes[index - 1] = temp
    await updateAttributeSortOrders(newAttributes)
  }

  const moveAttributeDown = async (index: number) => {
    if (index >= attributes.length - 1) return
    const newAttributes = [...attributes]; const temp = newAttributes[index]; newAttributes[index] = newAttributes[index + 1]; newAttributes[index + 1] = temp
    await updateAttributeSortOrders(newAttributes)
  }

  const updateAttributeSortOrders = async (newAttributes: Attribute[]) => {
    try {
      await Promise.all(newAttributes.map((attr, index) => fetch(`/api/suppliers/attributes/${attr.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: attr.name, code: attr.code, codeLength: attr.code_length, enabled: attr.enabled, sortOrder: index }) })))
      fetchAttributes()
    } catch (error) { console.error('更新属性排序失败:', error); toast({ variant: 'destructive', title: '排序失败' }) }
  }

  const openEditDialog = (attribute: Attribute, value: AttributeValue) => {
    setManagingAttribute(attribute); setEditingValue(value); setValueFormData({ name: value.name, code: value.code, parentId: value.parent_id }); setIsEditValueDialogOpen(true)
  }

  const openAttributeEditDialog = (attribute: Attribute) => {
    setEditingAttribute(attribute)
    setEditFormData({
      name: attribute.name, fieldCode: attribute.field_code || '', codeLength: attribute.code_length,
      enabled: attribute.enabled !== undefined ? attribute.enabled : true, width: attribute.width || 100,
      columns: attribute.columns || 1, columnWidth: attribute.column_width || 1, spacing: attribute.spacing || 2,
      rowIndex: attribute.row_index || 1, newRow: attribute.new_row || false, groupSortOrder: attribute.group_sort_order || 0,
      isRequired: attribute.is_required || false, group: attribute.group_id ? String(attribute.group_id) : '',
      fieldType: attribute.field_type || 'single_select',
    })
    setIsEditDialogOpen(true)
  }

  const filteredAttributes = useMemo(() => {
    return attributes.filter(attribute => {
      if (selectedGroupId !== null && attribute.group_id !== selectedGroupId) return false
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return attribute.name.toLowerCase().includes(query) || attribute.code.toLowerCase().includes(query)
    })
  }, [attributes, selectedGroupId, searchQuery])

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>

  return (
    <div className="min-h-screen bg-gray-50" style={{ padding: 'var(--page-padding)' }}>
      <div style={{ marginBottom: 'var(--section-gap)' }}>
        <h1 className="text-2xl font-medium text-gray-900 mb-1">供应商属性管理</h1>
        <p className="text-sm text-gray-400">配置供应商属性分类，如类型、级别、地区等</p>
      </div>

      {/* 分组管理 */}
      <div className="mb-6 bg-gray-50" style={{ padding: 'var(--card-padding)', borderRadius: 'var(--card-radius)', borderWidth: 'var(--card-border-width)', borderColor: 'var(--border-color)', borderStyle: 'solid' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">分组管理</h3>
          <Dialog open={isGroupDialogOpen} onOpenChange={(open) => { setIsGroupDialogOpen(open); if (!open) setNewGroupName('') }}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />添加分组</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-hidden p-0">
              <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100"><DialogTitle className="text-sm font-medium text-gray-900">添加分组</DialogTitle></DialogHeader>
              <div className="flex flex-col max-h-[calc(80vh-100px)]">
                <div className="flex-1 overflow-y-auto px-4 py-2">
                  <div><Label htmlFor="groupName" className="text-xs text-gray-500 mb-1 block">分组名称</Label>
                    <Input id="groupName" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="例如：基础信息" className="h-8 text-xs bg-white border-gray-200 w-full" onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()} /></div>
                </div>
                <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsGroupDialogOpen(false)} className="h-7 text-xs">取消</Button>
                  <Button type="button" size="sm" onClick={handleAddGroup} disabled={groupSubmitting} className="h-7 text-xs bg-blue-500 hover:bg-blue-600">{groupSubmitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}添加</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {attributeGroups.length === 0 ? (<p className="text-sm text-gray-400">暂无分组，点击上方按钮添加</p>) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
            <SortableContext items={attributeGroups.map(g => g.id.toString())} strategy={horizontalListSortingStrategy}>
              <div className="flex flex-wrap gap-2">
                {attributeGroups.map((group) => (
                  <SortableGroupItem key={group.id} group={group} isSelected={selectedGroupId === group.id} isEditing={editingGroupId === group.id} editingName={editingGroupName}
                    onSelect={() => { if (selectedGroupId === group.id) setSelectedGroupId(null); else setSelectedGroupId(group.id) }}
                    onEdit={() => { setEditingGroupId(group.id); setEditingGroupName(group.name) }}
                    onDelete={() => handleDeleteGroup(group.id, group.name)}
                    onEditChange={setEditingGroupName}
                    onEditSubmit={() => handleUpdateGroupName(group.id, editingGroupName)}
                    onEditCancel={() => { setEditingGroupId(null); setEditingGroupName('') }} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        {selectedGroupId !== null && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">已筛选分组：<span className="font-medium text-gray-700">{attributeGroups.find(g => g.id === selectedGroupId)?.name}</span></span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700" onClick={() => setSelectedGroupId(null)}>清除筛选</Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="搜索属性名称或编码..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        
        <Dialog open={isBatchEditOpen} onOpenChange={(open) => { setIsBatchEditOpen(open); if (!open) setBatchFormData({ group: { value: '', enabled: false }, width: { value: 100, enabled: false }, columns: { value: 1, enabled: false }, columnWidth: { value: 1, enabled: false }, spacing: { value: 2, enabled: false }, rowIndex: { value: 1, enabled: false }, groupSortOrder: { value: 0, enabled: false }, isRequired: { value: false, enabled: false } }) }}>
          <DialogTrigger asChild><Button variant="outline" disabled={selectedIds.size === 0}><Settings2 className="h-4 w-4 mr-2" />批量编辑 ({selectedIds.size})</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-medium">批量编辑布局配置</DialogTitle></DialogHeader>
            <form onSubmit={handleBatchEdit}>
              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-600">已选择 <span className="font-medium">{selectedIds.size}</span> 个属性</p>
                <div className="flex items-center gap-3">
                  <Checkbox id="batchGroup" checked={batchFormData.group.enabled} onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, group: { ...batchFormData.group, enabled: checked as boolean } })} />
                  <div className="flex-1"><Label htmlFor="batchGroup">分组</Label>
                    <Select value={batchFormData.group.value || "none"} onValueChange={(value) => setBatchFormData({ ...batchFormData, group: { ...batchFormData.group, value: value === "none" ? "" : value } })} disabled={!batchFormData.group.enabled}>
                      <SelectTrigger><SelectValue placeholder="选择分组" /></SelectTrigger>
                      <SelectContent><SelectItem value="none">无分组</SelectItem>{attributeGroups.map((group) => (<SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>))}</SelectContent>
                    </Select></div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="batchWidth" checked={batchFormData.width.enabled} onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, width: { ...batchFormData.width, enabled: checked as boolean } })} />
                  <div className="flex-1"><Label htmlFor="batchWidth">宽度 (%)</Label><Input type="number" value={batchFormData.width.value} onChange={(e) => setBatchFormData({ ...batchFormData, width: { ...batchFormData.width, value: parseInt(e.target.value) } })} disabled={!batchFormData.width.enabled} /></div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="batchIsRequired" checked={batchFormData.isRequired.enabled} onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, isRequired: { ...batchFormData.isRequired, enabled: checked as boolean } })} />
                  <div className="flex-1"><Label htmlFor="batchIsRequired">必选</Label><Switch checked={batchFormData.isRequired.value} onCheckedChange={(checked) => setBatchFormData({ ...batchFormData, isRequired: { ...batchFormData.isRequired, value: checked as boolean } })} disabled={!batchFormData.isRequired.enabled} className="data-[state=checked]:bg-orange-600" /></div>
                </div>
              </div>
              <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsBatchEditOpen(false)}>取消</Button><Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}保存</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setFormData({ name: '', fieldCode: '', codeLength: 2, enabled: true, isRequired: false, group: '', width: 100, columns: 1, columnWidth: 1, spacing: 2, rowIndex: 1, newRow: false, groupSortOrder: 0, fieldType: 'single_select' }) }}>
          <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" />添加属性分类</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-hidden p-0">
            <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100"><DialogTitle className="text-sm font-medium text-gray-900">添加属性分类</DialogTitle></DialogHeader>
            <form onSubmit={handleAddAttribute} className="flex flex-col max-h-[calc(80vh-100px)]">
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><Type className="h-3.5 w-3.5" />基本信息</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label htmlFor="name" className="text-xs text-gray-500 mb-1 block">属性名称</Label><Input id="name" value={formData.name} onChange={(e) => { const newName = e.target.value; setFormData({ ...formData, name: newName, fieldCode: generateFieldCode(newName) }) }} placeholder="例如：类型" className="h-8 text-xs bg-white border-gray-200 w-full" required /></div>
                    <div><Label htmlFor="fieldCode" className="text-xs text-gray-500 mb-1 block">数据库字段名</Label><Input id="fieldCode" value={formData.fieldCode} placeholder="自动生成" className="h-8 text-xs bg-gray-100 border-gray-200 w-full text-gray-600" readOnly /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label htmlFor="fieldType" className="text-xs text-gray-500 mb-1 block">字段类型</Label>
                      <Select value={formData.fieldType || "single_select"} onValueChange={(value) => setFormData({ ...formData, fieldType: value })}>
                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full"><SelectValue placeholder="选择类型" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single_select" className="text-xs">单选</SelectItem>
                          <SelectItem value="text" className="text-xs">文本</SelectItem>
                        </SelectContent>
                      </Select></div>
                    <div><Label htmlFor="codeLength" className="text-xs text-gray-500 mb-1 block">编码位数</Label><Input id="codeLength" type="number" value={formData.codeLength} onChange={(e) => setFormData({ ...formData, codeLength: parseInt(e.target.value) })} min="1" max="10" className="h-8 text-xs bg-white border-gray-200 w-full" required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label htmlFor="group" className="text-xs text-gray-500 mb-1 block">分组</Label>
                      <Select value={formData.group || "none"} onValueChange={(value) => setFormData({ ...formData, group: value === "none" ? "" : value })}>
                        <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full"><SelectValue placeholder="选择分组" /></SelectTrigger>
                        <SelectContent><SelectItem value="none" className="text-xs">无分组</SelectItem>{attributeGroups.map((group) => (<SelectItem key={group.id} value={group.id.toString()} className="text-xs">{group.name}</SelectItem>))}</SelectContent>
                      </Select></div>
                    <div></div>
                  </div>
                  <div className="flex items-center gap-8">
                    <label className="flex items-center gap-2 cursor-pointer"><Switch id="isRequired" checked={formData.isRequired} onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })} className="data-[state=checked]:bg-red-500" /><span className="text-xs text-gray-600">必填字段</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><Switch id="enabled" checked={formData.enabled} onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })} className="data-[state=checked]:bg-green-500" /><span className="text-xs text-gray-600">启用字段</span></label>
                  </div>
                </div>
                <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><LayoutGrid className="h-3.5 w-3.5" />布局配置</div>
                  <div className="grid grid-cols-5 gap-2">
                    <div><Label htmlFor="width" className="text-xs text-gray-500 mb-1 block">宽度 (%)</Label><Input id="width" type="number" value={formData.width} onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) })} min="1" max="100" className="h-8 text-xs bg-white border-gray-200 w-full" /></div>
                    <div><Label htmlFor="columns" className="text-xs text-gray-500 mb-1 block">列数</Label><Input id="columns" type="number" value={formData.columns} onChange={(e) => setFormData({ ...formData, columns: parseInt(e.target.value) })} min="1" max="12" className="h-8 text-xs bg-white border-gray-200 w-full" /></div>
                    <div><Label htmlFor="columnWidth" className="text-xs text-gray-500 mb-1 block">列宽</Label><Input id="columnWidth" type="number" value={formData.columnWidth} onChange={(e) => setFormData({ ...formData, columnWidth: parseInt(e.target.value) })} min="1" max="12" className="h-8 text-xs bg-white border-gray-200 w-full" /></div>
                    <div><Label htmlFor="spacing" className="text-xs text-gray-500 mb-1 block">间距</Label><Input id="spacing" type="number" value={formData.spacing} onChange={(e) => setFormData({ ...formData, spacing: parseInt(e.target.value) })} min="0" max="5" className="h-8 text-xs bg-white border-gray-200 w-full" /></div>
                    <div><Label htmlFor="rowIndex" className="text-xs text-gray-500 mb-1 block">行号</Label><Input id="rowIndex" type="number" value={formData.rowIndex} onChange={(e) => setFormData({ ...formData, rowIndex: parseInt(e.target.value) })} min="1" max="100" className="h-8 text-xs bg-white border-gray-200 w-full" /></div>
                  </div>
                  <div className="flex items-center justify-between pt-0.5 border-t border-gray-200/50">
                    <label className="flex items-center gap-2 cursor-pointer"><Switch id="newRow" checked={formData.newRow} onCheckedChange={(checked) => setFormData({ ...formData, newRow: checked })} className="data-[state=checked]:bg-blue-500" /><span className="text-xs text-gray-600">新行</span></label>
                    <span className="text-[10px] text-gray-400">开启后，该属性单独占据一行</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)} className="h-8 text-xs">取消</Button>
                <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-blue-500 hover:bg-blue-600">{submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}保存</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Attributes Table */}
      <div className="bg-white overflow-hidden w-full" style={{ borderRadius: 'var(--card-radius)', borderWidth: 'var(--card-border-width)', borderColor: 'var(--border-color)', borderStyle: 'solid' }}>
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex items-center gap-2"><Settings2 className="h-3 w-3" /><span><strong>提示：</strong>点击"列设置"可显示/隐藏列、冻结列</span></div>
        <div className="border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 h-10">
                <th className="w-9 px-2"><Checkbox checked={selectedIds.size === attributes.length && selectedIds.size > 0} onCheckedChange={handleSelectAll} /></th>
                <th className="w-12 px-2 text-center">序号</th>
                <th className="w-14 px-2 text-center">排序</th>
                <th className="px-3 text-left">分组</th>
                <th className="px-3 text-left">属性名称</th>
                <th className="px-3 text-center">子属性数</th>
                <th className="px-3 text-center">子属性代码</th>
                <th className="px-3 text-center">行号</th>
                <th className="px-3 text-center">列数</th>
                <th className="px-3 text-center">宽度</th>
                <th className="px-3 text-center">必选</th>
                <th className="px-3 text-center">启用</th>
                <th className="w-40 px-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attributes.length === 0 ? (
                <tr><td colSpan={13} className="px-6 py-12 text-center text-gray-400 text-sm">暂无属性配置，点击上方按钮添加</td></tr>
              ) : filteredAttributes.length === 0 ? (
                <tr><td colSpan={13} className="px-6 py-12 text-center text-gray-400 text-sm">未找到匹配的属性</td></tr>
              ) : (
                filteredAttributes.map((attribute, index) => (
                  <tr key={attribute.id} className="group hover:bg-gray-50 transition-colors h-11">
                    <td className="w-9 px-2"><Checkbox checked={selectedIds.has(attribute.id)} onCheckedChange={() => handleToggleSelect(attribute.id)} /></td>
                    <td className="w-12 px-2 text-center text-sm text-gray-600">{index + 1}</td>
                    <td className="w-14 px-2">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700" onClick={() => moveAttributeUp(index)} disabled={index === 0}><ChevronUp className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700" onClick={() => moveAttributeDown(index)} disabled={index >= attributes.length - 1}><ChevronDown className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                    <td className="px-3 text-sm text-gray-600 whitespace-nowrap">{attribute.supplier_attribute_groups?.name || attributeGroups.find((g) => g.id === attribute.group_id)?.name || '-'}</td>
                    <td className="px-3 text-sm font-medium text-gray-900 whitespace-nowrap">{attribute.name}</td>
                    <td className="px-3 text-center text-sm text-gray-600">{attribute.supplier_attribute_values?.length || 0}</td>
                    <td className="px-3 text-center text-sm text-gray-600">{attribute.code_length} 位</td>
                    <td className="px-3 text-center text-sm text-gray-600">{attribute.row_index}</td>
                    <td className="px-3 text-center text-sm text-gray-600">{attribute.columns}</td>
                    <td className="px-3 text-center text-sm text-gray-600">{attribute.width}%</td>
                    <td className="px-3 text-center"><Switch checked={attribute.is_required} onCheckedChange={() => handleToggleRequired(attribute)} className="data-[state=checked]:bg-orange-600" /></td>
                    <td className="px-3 text-center"><Switch checked={attribute.enabled} onCheckedChange={() => handleToggleAttribute(attribute)} className="data-[state=checked]:bg-green-600" /></td>
                    <td className="w-40 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100" onClick={() => openAttributeEditDialog(attribute)}><Edit className="h-3.5 w-3.5 mr-1" />编辑</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100" onClick={() => { setManagingAttribute(attribute); setIsManageValuesDialogOpen(true) }}><List className="h-3.5 w-3.5 mr-1" />管理</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteAttribute(attribute.id)}><Trash2 className="h-3.5 w-3.5 mr-1" />删除</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 属性值管理弹窗 */}
      <Dialog open={isManageValuesDialogOpen} onOpenChange={(open) => { setIsManageValuesDialogOpen(open); if (!open) { setManagingAttribute(null); setValueFormData({ name: '', code: '', parentId: null }) } }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100"><DialogTitle className="text-sm font-medium text-gray-900">管理子字段 - {managingAttribute?.name}</DialogTitle></DialogHeader>
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">共 {managingAttribute?.supplier_attribute_values?.length || 0} 个子字段</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSelectedAttribute(managingAttribute); setIsValueDialogOpen(true) }}><Plus className="h-3 w-3 mr-1" />添加值</Button>
          </div>
          <div className="flex flex-col max-h-[calc(80vh-140px)]">
            <div className="flex-1 overflow-y-auto">
              {managingAttribute && <AttributeValueList attribute={managingAttribute} onEdit={(value) => { setEditingValue(value); setIsEditValueDialogOpen(true) }} onDelete={handleDeleteValue} onMoveUp={moveValueUp} onMoveDown={moveValueDown} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加属性值弹窗 */}
      <Dialog open={isValueDialogOpen} onOpenChange={(open) => { setIsValueDialogOpen(open); if (!open) { setSelectedAttribute(null); setValueFormData({ name: '', code: '', parentId: null }) } }}>
        <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100"><DialogTitle className="text-sm font-medium text-gray-900">添加属性值 - {selectedAttribute?.name || managingAttribute?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleAddValue} className="flex flex-col max-h-[calc(80vh-100px)]">
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              <div><Label htmlFor="valueName" className="text-xs text-gray-500 mb-1 block">值名称</Label><Input id="valueName" value={valueFormData.name} onChange={(e) => setValueFormData({ ...valueFormData, name: e.target.value })} placeholder="例如：一级" className="h-8 text-xs bg-white border-gray-200 w-full" required /></div>
              <div><Label htmlFor="valueCode" className="text-xs text-gray-500 mb-1 block">值代码 (最多 {(selectedAttribute || managingAttribute)?.code_length} 位)</Label>
                <Input id="valueCode" value={valueFormData.code} onChange={(e) => { const value = e.target.value.toUpperCase(); const maxLen = (selectedAttribute || managingAttribute)?.code_length || 2; if (value.length <= maxLen) setValueFormData({ ...valueFormData, code: value }) }} placeholder="例如：01" maxLength={(selectedAttribute || managingAttribute)?.code_length} className="h-8 text-xs bg-white border-gray-200 w-full" required />
                <p className="text-[10px] text-gray-400 mt-1">已输入 {valueFormData.code.length} / {(selectedAttribute || managingAttribute)?.code_length || 2} 位</p></div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsValueDialogOpen(false)} className="h-8 text-xs">取消</Button>
              <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-blue-500 hover:bg-blue-600">{submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}保存</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑属性分类对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingAttribute(null); setEditFormData({ name: '', fieldCode: '', codeLength: 2, enabled: true, width: 100, columns: 1, columnWidth: 1, spacing: 2, rowIndex: 1, newRow: false, groupSortOrder: 0, isRequired: false, group: '', fieldType: 'single_select' }) } }}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100"><DialogTitle className="text-sm font-medium text-gray-900">编辑属性分类</DialogTitle></DialogHeader>
          <form onSubmit={handleEditAttribute} className="flex flex-col max-h-[calc(80vh-100px)]">
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><Type className="h-3.5 w-3.5" />基本信息</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label htmlFor="editName" className="text-xs text-gray-500 mb-1 block">属性名称</Label><Input id="editName" value={editFormData.name} onChange={(e) => { const newName = e.target.value; setEditFormData({ ...editFormData, name: newName, fieldCode: generateFieldCode(newName) }) }} placeholder="例如：类型" className="h-8 text-xs bg-white border-gray-200 w-full" required /></div>
                  <div><Label htmlFor="editFieldCode" className="text-xs text-gray-500 mb-1 block">数据库字段名</Label><Input id="editFieldCode" value={editFormData.fieldCode} placeholder="自动生成" className="h-8 text-xs bg-gray-100 border-gray-200 w-full text-gray-600" readOnly /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label htmlFor="editFieldType" className="text-xs text-gray-500 mb-1 block">字段类型</Label>
                    <Select value={editFormData.fieldType || "single_select"} onValueChange={(value) => setEditFormData({ ...editFormData, fieldType: value })}>
                      <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full"><SelectValue placeholder="选择类型" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_select" className="text-xs">单选</SelectItem>
                        <SelectItem value="text" className="text-xs">文本</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div><Label htmlFor="editCodeLength" className="text-xs text-gray-500 mb-1 block">编码位数</Label><Input id="editCodeLength" type="number" value={editFormData.codeLength} onChange={(e) => setEditFormData({ ...editFormData, codeLength: parseInt(e.target.value) })} min="1" max="10" className="h-8 text-xs bg-white border-gray-200 w-full" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label htmlFor="editGroup" className="text-xs text-gray-500 mb-1 block">分组</Label>
                    <Select value={editFormData.group || "none"} onValueChange={(value) => setEditFormData({ ...editFormData, group: value === "none" ? "" : value })}>
                      <SelectTrigger id="editGroup" className="h-8 text-xs bg-white border-gray-200 w-full"><SelectValue placeholder="选择分组" /></SelectTrigger>
                      <SelectContent><SelectItem value="none" className="text-xs">无分组</SelectItem>{attributeGroups.map((group) => (<SelectItem key={group.id} value={group.id.toString()} className="text-xs">{group.name}</SelectItem>))}</SelectContent>
                    </Select></div>
                  <div></div>
                </div>
                <div className="flex items-center gap-8">
                  <label className="flex items-center gap-2 cursor-pointer"><Switch id="editIsRequired" checked={editFormData.isRequired} onCheckedChange={(checked) => setEditFormData({ ...editFormData, isRequired: checked })} className="data-[state=checked]:bg-red-500" /><span className="text-xs text-gray-600">必填字段</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><Switch id="editEnabled" checked={editFormData.enabled} onCheckedChange={(checked) => setEditFormData({ ...editFormData, enabled: checked })} className="data-[state=checked]:bg-green-500" /><span className="text-xs text-gray-600">启用字段</span></label>
                </div>
              </div>
              <div className="bg-gray-50/80 rounded-md p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><LayoutGrid className="h-3.5 w-3.5" />布局配置</div>
                <div className="grid grid-cols-5 gap-2">
                  <div><Label htmlFor="editWidth" className="text-xs text-gray-500 mb-1 block">宽度 (%)</Label><Input id="editWidth" type="number" value={editFormData.width} onChange={(e) => setEditFormData({ ...editFormData, width: parseInt(e.target.value) })} min="1" max="100" className="h-8 text-xs bg-white border-gray-200 w-full" /></div>
                  <div><Label htmlFor="editColumns" className="text-xs text-gray-500 mb-1 block">列数</Label><Input id="editColumns" type="number" value={editFormData.columns} onChange={(e) => setEditFormData({ ...editFormData, columns: parseInt(e.target.value) })} min="1" max="12" className="h-8 text-xs bg-white border-gray-200 w-full" /></div>
                  <div><Label htmlFor="editColumnWidth" className="text-xs text-gray-500 mb-1 block">列宽</Label><Input id="editColumnWidth" type="number" value={editFormData.columnWidth} onChange={(e) => setEditFormData({ ...editFormData, columnWidth: parseInt(e.target.value) })} min="1" max="12" className="h-8 text-xs bg-white border-gray-200 w-full" /></div>
                  <div><Label htmlFor="editSpacing" className="text-xs text-gray-500 mb-1 block">间距</Label><Input id="editSpacing" type="number" value={editFormData.spacing} onChange={(e) => setEditFormData({ ...editFormData, spacing: parseInt(e.target.value) })} min="0" max="5" className="h-8 text-xs bg-white border-gray-200 w-full" /></div>
                  <div><Label htmlFor="editRowIndex" className="text-xs text-gray-500 mb-1 block">行号</Label><Input id="editRowIndex" type="number" value={editFormData.rowIndex} onChange={(e) => setEditFormData({ ...editFormData, rowIndex: parseInt(e.target.value) })} min="1" max="100" className="h-8 text-xs bg-white border-gray-200 w-full" /></div>
                </div>
                <div className="flex items-center justify-between pt-0.5 border-t border-gray-200/50">
                  <label className="flex items-center gap-2 cursor-pointer"><Switch id="editNewRow" checked={editFormData.newRow} onCheckedChange={(checked) => setEditFormData({ ...editFormData, newRow: checked })} className="data-[state=checked]:bg-blue-500" /><span className="text-xs text-gray-600">新行</span></label>
                  <span className="text-[10px] text-gray-400">开启后，该属性单独占据一行</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditDialogOpen(false)} className="h-8 text-xs">取消</Button>
              <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-blue-500 hover:bg-blue-600">{submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}保存</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑属性值对话框 */}
      <Dialog open={isEditValueDialogOpen} onOpenChange={(open) => { setIsEditValueDialogOpen(open); if (!open) { setEditingValue(null); setValueFormData({ name: '', code: '', parentId: null }) } }}>
        <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2.5 border-b border-gray-100"><DialogTitle className="text-sm font-medium text-gray-900">编辑属性值 - {managingAttribute?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleEditValue} className="flex flex-col max-h-[calc(80vh-100px)]">
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              <div><Label htmlFor="editValueName" className="text-xs text-gray-500 mb-1 block">值名称</Label><Input id="editValueName" value={valueFormData.name} onChange={(e) => setValueFormData({ ...valueFormData, name: e.target.value })} placeholder="例如：一级" className="h-8 text-xs bg-white border-gray-200 w-full" required /></div>
              <div><Label htmlFor="editValueCode" className="text-xs text-gray-500 mb-1 block">值代码 (最多 {managingAttribute?.code_length} 位)</Label>
                <Input id="editValueCode" value={valueFormData.code} onChange={(e) => { const value = e.target.value.toUpperCase(); const maxLen = managingAttribute?.code_length || 2; if (value.length <= maxLen) setValueFormData({ ...valueFormData, code: value }) }} placeholder="例如：01" maxLength={managingAttribute?.code_length} className="h-8 text-xs bg-white border-gray-200 w-full" required />
                <p className="text-[10px] text-gray-400 mt-1">已输入 {valueFormData.code.length} / {managingAttribute?.code_length || 2} 位</p></div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/30">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditValueDialogOpen(false)} className="h-8 text-xs">取消</Button>
              <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs bg-blue-500 hover:bg-blue-600">{submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}保存</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
