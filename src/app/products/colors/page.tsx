'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, GripVertical, ChevronRight, ChevronDown as ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ColorPicker } from '@/components/ui/color-picker'

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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ColorValue {
  id: number
  group_id: number
  name: string
  code: string
  transparency: number
  hex_code: string
  sort_order: number
}

interface ColorGroup {
  id: number
  name: string
  code: string
  sort_order: number
  code_length: number
  color?: string
  color_values?: ColorValue[]
}

// 可排序列表行组件
function SortableGroupRow({
  group,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddColor,
  onEditColor,
  onDeleteColor,
  onMoveColor,
  onMoveGroupUp,
  onMoveGroupDown,
  isFirst,
  isLast
}: {
  group: ColorGroup
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: (group: ColorGroup) => void
  onDelete: (groupId: number) => void
  onAddColor: (group: ColorGroup) => void
  onEditColor: (color: ColorValue) => void
  onDeleteColor: (colorId: number) => void
  onMoveColor: (groupId: number, colorId: number, direction: 'up' | 'down') => void
  onMoveGroupUp: () => void
  onMoveGroupDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  // 获取颜色指示器样式
  const getColorIndicator = () => {
    return {
      background: `linear-gradient(135deg, ${group.color || '#3B82F6'} 0%, ${(group.color || '#3B82F6')}dd 100%)`,
      boxShadow: `0 2px 12px ${(group.color || '#3B82F6')}40`,
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="group">
      {/* 主行 */}
      <div 
        className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50 border-b border-gray-100 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${(group.color || '#3B82F6')}08 0%, ${(group.color || '#3B82F6')}04 100%)`
        }}
      >
        {/* 拖拽手柄 */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
          title="拖动排序"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* 展开/折叠按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 flex-shrink-0 text-gray-400 hover:text-gray-700"
          onClick={onToggleExpand}
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* 颜色指示器 */}
        <div 
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={getColorIndicator()}
        />

        {/* 色系名称 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">{group.name}</h3>
          <p className="text-xs text-gray-500">{group.code}</p>
        </div>

        {/* 颜色数量 */}
        <div className="w-20 flex-shrink-0">
          <Badge variant="secondary" className="text-xs font-medium bg-gray-100/60 text-gray-600">
            {group.color_values?.length || 0} 个
          </Badge>
        </div>

        {/* 排序按钮 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
            onClick={onMoveGroupUp}
            disabled={isFirst}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
            onClick={onMoveGroupDown}
            disabled={isLast}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs text-gray-600 hover:text-gray-900"
            onClick={() => onAddColor(group)}
          >
            <Plus className="h-3 w-3 mr-1" />
            添加颜色
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs text-gray-600 hover:text-gray-900"
            onClick={() => onEdit(group)}
          >
            <Edit2 className="h-3 w-3 mr-1" />
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs text-gray-600 hover:text-red-600"
            onClick={() => onDelete(group.id)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            删除
          </Button>
        </div>
      </div>

      {/* 颜色值列表（展开时显示） */}
      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
          {group.color_values && group.color_values.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 px-3 py-2 text-xs text-gray-500">
                <span className="w-8 text-center">序号</span>
                <span className="w-16 text-center">排序</span>
                <span className="flex-1">颜色名称</span>
                <span className="w-20 text-center">颜色代码</span>
                <span className="w-32 text-center">操作</span>
              </div>
              {group.color_values.map((color, index) => (
                <div
                  key={color.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="w-8 text-sm text-gray-600 text-center">{index + 1}</span>
                  <div className="w-16 flex items-center justify-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                      onClick={() => onMoveColor(group.id, color.id, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                      onClick={() => onMoveColor(group.id, color.id, 'down')}
                      disabled={index >= group.color_values!.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{color.name}</span>
                  <div className="w-20 flex justify-center">
                    <Badge variant="outline" className="text-xs font-mono">
                      {color.code}
                    </Badge>
                  </div>
                  <div className="w-32 flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-gray-600 hover:text-gray-900"
                      onClick={() => onEditColor(color)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-gray-600 hover:text-red-600"
                      onClick={() => onDeleteColor(color.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 mb-3">暂无颜色</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddColor(group)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-8"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加第一个颜色
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ColorsPage() {
  const [groups, setGroups] = useState<ColorGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false)
  const [isEditValueDialogOpen, setIsEditValueDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<ColorGroup | null>(null)
  const [editingGroup, setEditingGroup] = useState<ColorGroup | null>(null)
  const [editingColor, setEditingColor] = useState<ColorValue | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    codeLength: 2,
    color: '#3B82F6',
  })
  const [valueFormData, setValueFormData] = useState({
    name: '',
    code: '',
  })
  const [addingColor, setAddingColor] = useState(false)
  const [savingGroup, setSavingGroup] = useState(false)
  const [savingColor, setSavingColor] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/products/color-groups')
      const result = await response.json()
      if (result.data) {
        setGroups(result.data)
      }
    } catch (error) {
      console.error('获取颜色组失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex((item) => item.id === active.id)
      const newIndex = groups.findIndex((item) => item.id === over.id)

      const newGroups = arrayMove(groups, oldIndex, newIndex)
      setGroups(newGroups)

      try {
        const items = newGroups.map((group, index) => ({
          id: group.id,
          sort_order: index,
        }))
        await fetch('/api/products/color-groups/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        })
      } catch (error) {
        console.error('更新排序失败:', error)
        fetchGroups()
      }
    }
  }

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGroup(true)
    try {
      const response = await fetch('/api/products/color-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          color: formData.color,
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        fetchGroups()
        setFormData({ name: '', code: '', codeLength: 2, color: '#3B82F6' })
      }
    } catch (error) {
      console.error('添加颜色组失败:', error)
    } finally {
      setSavingGroup(false)
    }
  }

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return

    setSavingGroup(true)
    try {
      const response = await fetch(`/api/products/color-groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          color: formData.color,
        }),
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        fetchGroups()
        setFormData({ name: '', code: '', codeLength: 2, color: '#3B82F6' })
        setEditingGroup(null)
      }
    } catch (error) {
      console.error('更新颜色组失败:', error)
    } finally {
      setSavingGroup(false)
    }
  }

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('确定要删除这个颜色组及其所有颜色吗？此操作不可恢复。')) return

    try {
      const response = await fetch(`/api/products/color-groups/${groupId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchGroups()
      }
    } catch (error) {
      console.error('删除颜色组失败:', error)
    }
  }

  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup) return

    setAddingColor(true)
    try {
      const response = await fetch('/api/products/color-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          name: valueFormData.name,
          code: valueFormData.code,
          sortOrder: (selectedGroup.color_values?.length || 0) + 1,
        }),
      })

      if (response.ok) {
        setIsValueDialogOpen(false)
        fetchGroups()
        setValueFormData({ name: '', code: '' })
      }
    } catch (error) {
      console.error('添加颜色失败:', error)
    } finally {
      setAddingColor(false)
    }
  }

  const handleEditColor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingColor) return

    setSavingColor(true)
    try {
      const response = await fetch(`/api/products/color-values/${editingColor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: valueFormData.name,
          code: valueFormData.code,
          transparency: editingColor.transparency,
          hexCode: editingColor.hex_code,
        }),
      })

      if (response.ok) {
        setIsEditValueDialogOpen(false)
        fetchGroups()
        setValueFormData({ name: '', code: '' })
        setEditingColor(null)
      }
    } catch (error) {
      console.error('更新颜色失败:', error)
    } finally {
      setSavingColor(false)
    }
  }

  const handleDeleteColor = async (colorId: number) => {
    if (!confirm('确定要删除这个颜色吗？')) return

    try {
      const response = await fetch(`/api/products/color-values/${colorId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchGroups()
      }
    } catch (error) {
      console.error('删除颜色失败:', error)
    }
  }

  const handleMoveColor = async (groupId: number, colorId: number, direction: 'up' | 'down') => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const colors = [...(group.color_values || [])]
    const index = colors.findIndex(c => c.id === colorId)
    
    if (index < 0) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === colors.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    const temp = colors[index].sort_order
    colors[index].sort_order = colors[newIndex].sort_order
    colors[newIndex].sort_order = temp

    try {
      await Promise.all([
        fetch(`/api/products/color-values/${colors[index].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: colors[index].name,
            code: colors[index].code,
            transparency: colors[index].transparency,
            hexCode: colors[index].hex_code,
          }),
        }),
        fetch(`/api/products/color-values/${colors[newIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: colors[newIndex].name,
            code: colors[newIndex].code,
            transparency: colors[newIndex].transparency,
            hexCode: colors[newIndex].hex_code,
          }),
        }),
      ])
      fetchGroups()
    } catch (error) {
      console.error('排序失败:', error)
    }
  }

  const handleMoveGroupUp = async (index: number) => {
    if (index <= 0) return

    const newGroups = [...groups]
    const temp = newGroups[index]
    newGroups[index] = newGroups[index - 1]
    newGroups[index - 1] = temp

    await updateGroupSortOrders(newGroups)
  }

  const handleMoveGroupDown = async (index: number) => {
    if (index >= groups.length - 1) return

    const newGroups = [...groups]
    const temp = newGroups[index]
    newGroups[index] = newGroups[index + 1]
    newGroups[index + 1] = temp

    await updateGroupSortOrders(newGroups)
  }

  const updateGroupSortOrders = async (newGroups: ColorGroup[]) => {
    try {
      await Promise.all(
        newGroups.map((group, index) =>
          fetch(`/api/products/color-groups/${group.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: group.name,
              code: group.code,
              codeLength: group.code_length,
              color: group.color || '#3B82F6',
              sortOrder: index,
            }),
          })
        )
      )
      fetchGroups()
    } catch (error) {
      console.error('更新颜色组排序失败:', error)
    }
  }

  const toggleExpand = (groupId: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const openAddColorDialog = (group: ColorGroup) => {
    setSelectedGroup(group)
    setValueFormData({
      name: '',
      code: '',
    })
    setIsValueDialogOpen(true)
  }

  const openEditColorDialog = (color: ColorValue) => {
    setEditingColor(color)
    setValueFormData({
      name: color.name,
      code: color.code,
    })
    setIsEditValueDialogOpen(true)
  }

  const openEditGroupDialog = (group: ColorGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      code: group.code,
      codeLength: group.code_length,
      color: group.color || '#3B82F6',
    })
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400 font-medium">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">颜色组管理</h1>
        <p className="text-sm text-gray-500">配置颜色分类、具体颜色和透明度</p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center gap-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-6 font-medium shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <Plus className="h-5 w-5 mr-2" />
              添加颜色组
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">添加颜色组</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddGroup}>
              <div className="space-y-5 py-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">色系名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：红色系"
                    required
                    className="mt-2 h-11 rounded-xl border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="code" className="text-sm font-semibold text-gray-700">色系代码</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="例如：red"
                    required
                    className="mt-2 h-11 rounded-xl border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="codeLength" className="text-sm font-semibold text-gray-700">编码位数</Label>
                  <Input
                    id="codeLength"
                    type="number"
                    value={formData.codeLength}
                    onChange={(e) => setFormData({ ...formData, codeLength: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                    required
                    className="mt-2 h-11 rounded-xl border-gray-200"
                  />
                </div>
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                  label="色系颜色"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl px-6">
                  取消
                </Button>
                <Button type="submit" disabled={savingGroup} className="h-11 rounded-xl px-6">
                  {savingGroup ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Color Groups List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 表头 */}
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
          <div className="w-8" />
          <div className="w-7" />
          <div className="w-4" />
          <div className="flex-1">色系名称</div>
          <div className="w-20 text-center">颜色数量</div>
          <div className="w-20 text-center">排序</div>
          <div className="w-64 text-center">操作</div>
        </div>

        {/* 数据列表 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
            {groups.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-gray-400 font-medium">暂无颜色组配置</p>
              </div>
            ) : (
              groups.map((group, index) => (
                <SortableGroupRow
                  key={group.id}
                  group={group}
                  isExpanded={expandedGroups.has(group.id)}
                  onToggleExpand={() => toggleExpand(group.id)}
                  onEdit={openEditGroupDialog}
                  onDelete={handleDeleteGroup}
                  onAddColor={openAddColorDialog}
                  onEditColor={openEditColorDialog}
                  onDeleteColor={handleDeleteColor}
                  onMoveColor={handleMoveColor}
                  onMoveGroupUp={() => handleMoveGroupUp(index)}
                  onMoveGroupDown={() => handleMoveGroupDown(index)}
                  isFirst={index === 0}
                  isLast={index === groups.length - 1}
                />
              ))
            )}
          </SortableContext>
        </DndContext>
      </div>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">编辑颜色组</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditGroup}>
            <div className="space-y-5 py-4">
              <div>
                <Label htmlFor="editName" className="text-sm font-semibold text-gray-700">色系名称</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：红色系"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="editCode" className="text-sm font-semibold text-gray-700">色系代码</Label>
                <Input
                  id="editCode"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="例如：red"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="editCodeLength" className="text-sm font-semibold text-gray-700">编码位数</Label>
                <Input
                  id="editCodeLength"
                  type="number"
                  value={formData.codeLength}
                  onChange={(e) => setFormData({ ...formData, codeLength: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
              <ColorPicker
                value={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
                label="色系颜色"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false)
                setEditingGroup(null)
              }} className="h-11 rounded-xl px-6">
                取消
              </Button>
              <Button type="submit" disabled={savingGroup} className="h-11 rounded-xl px-6">
                {savingGroup ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Color Dialog */}
      <Dialog open={isValueDialogOpen} onOpenChange={setIsValueDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              添加颜色 - {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddColor}>
            <div className="space-y-5 py-4">
              <div>
                <Label htmlFor="colorName" className="text-sm font-semibold text-gray-700">颜色名称</Label>
                <Input
                  id="colorName"
                  value={valueFormData.name}
                  onChange={(e) => setValueFormData({ ...valueFormData, name: e.target.value })}
                  placeholder="例如：深红"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="colorCode" className="text-sm font-semibold text-gray-700">颜色代码</Label>
                <Input
                  id="colorCode"
                  value={valueFormData.code}
                  onChange={(e) => setValueFormData({ ...valueFormData, code: e.target.value })}
                  placeholder="例如：darkred"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsValueDialogOpen(false)} className="h-11 rounded-xl px-6">
                取消
              </Button>
              <Button type="submit" disabled={addingColor} className="h-11 rounded-xl px-6">
                {addingColor ? '添加中...' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Color Dialog */}
      <Dialog open={isEditValueDialogOpen} onOpenChange={setIsEditValueDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">编辑颜色</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditColor}>
            <div className="space-y-5 py-4">
              <div>
                <Label htmlFor="editColorName" className="text-sm font-semibold text-gray-700">颜色名称</Label>
                <Input
                  id="editColorName"
                  value={valueFormData.name}
                  onChange={(e) => setValueFormData({ ...valueFormData, name: e.target.value })}
                  placeholder="例如：深红"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="editColorCode" className="text-sm font-semibold text-gray-700">颜色代码</Label>
                <Input
                  id="editColorCode"
                  value={valueFormData.code}
                  onChange={(e) => setValueFormData({ ...valueFormData, code: e.target.value })}
                  placeholder="例如：darkred"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsEditValueDialogOpen(false)
                setEditingColor(null)
              }} className="h-11 rounded-xl px-6">
                取消
              </Button>
              <Button type="submit" disabled={savingColor} className="h-11 rounded-xl px-6">
                {savingColor ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
