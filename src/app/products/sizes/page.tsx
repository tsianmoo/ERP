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
import { Badge } from '@/components/ui/badge'

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

interface SizeValue {
  id: number
  group_id: number
  name: string
  code: string
  sort_order: number
}

interface SizeGroup {
  id: number
  name: string
  code: string
  sort_order: number
  code_length: number
  size_values?: SizeValue[]
}

// 可排序列表行组件
function SortableGroupRow({
  group,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSize,
  onEditSize,
  onDeleteSize,
  onMoveSize,
  onMoveGroupUp,
  onMoveGroupDown,
  isFirst,
  isLast
}: {
  group: SizeGroup
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: (group: SizeGroup) => void
  onDelete: (groupId: number) => void
  onAddSize: (group: SizeGroup) => void
  onEditSize: (size: SizeValue) => void
  onDeleteSize: (sizeId: number) => void
  onMoveSize: (groupId: number, sizeId: number, direction: 'up' | 'down') => void
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

  // 获取尺码系指示器样式
  const getSizeIndicator = () => {
    return {
      background: `linear-gradient(135deg, #10B981 0%, #10B981dd 100%)`,
      boxShadow: `0 2px 12px #10B98140`,
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="group">
      {/* 主行 */}
      <div
        className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50 border-b border-gray-100 transition-colors"
        style={{
          background: `linear-gradient(135deg, #10B98108 0%, #10B98104 100%)`
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

        {/* 尺码系指示器 */}
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={getSizeIndicator()}
        />

        {/* 尺码系名称 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">{group.name}</h3>
          <p className="text-xs text-gray-500">{group.code}</p>
        </div>

        {/* 尺码数量 */}
        <div className="w-20 flex-shrink-0">
          <Badge variant="secondary" className="text-xs font-medium bg-gray-100/60 text-gray-600">
            {group.size_values?.length || 0} 个
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
            onClick={() => onAddSize(group)}
          >
            <Plus className="h-3 w-3 mr-1" />
            添加尺码
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

      {/* 尺码值列表（展开时显示） */}
      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
          {group.size_values && group.size_values.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 px-3 py-2 text-xs text-gray-500">
                <span className="w-8 text-center">序号</span>
                <span className="w-16 text-center">排序</span>
                <span className="flex-1">尺码名称</span>
                <span className="w-20 text-center">尺码代码</span>
                <span className="w-32 text-center">操作</span>
              </div>
              {group.size_values.map((size, index) => (
                <div
                  key={size.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="w-8 text-sm text-gray-600 text-center">{index + 1}</span>
                  <div className="w-16 flex items-center justify-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                      onClick={() => onMoveSize(group.id, size.id, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                      onClick={() => onMoveSize(group.id, size.id, 'down')}
                      disabled={index >= group.size_values!.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="flex-1 text-sm text-gray-900">{size.name}</span>
                  <div className="w-20 flex justify-center">
                    <Badge variant="outline" className="text-xs font-mono">
                      {size.code}
                    </Badge>
                  </div>
                  <div className="w-32 flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-gray-600 hover:text-gray-900"
                      onClick={() => onEditSize(size)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-gray-600 hover:text-red-600"
                      onClick={() => onDeleteSize(size.id)}
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
              <p className="text-sm text-gray-400 mb-3">暂无尺码</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddSize(group)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-8"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加第一个尺码
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SizesPage() {
  const [groups, setGroups] = useState<SizeGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false)
  const [isEditValueDialogOpen, setIsEditValueDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<SizeGroup | null>(null)
  const [editingGroup, setEditingGroup] = useState<SizeGroup | null>(null)
  const [editingSize, setEditingSize] = useState<SizeValue | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    codeLength: 2,
  })
  const [valueFormData, setValueFormData] = useState({
    name: '',
    code: '',
  })
  const [addingSize, setAddingSize] = useState(false)
  const [savingGroup, setSavingGroup] = useState(false)
  const [savingSize, setSavingSize] = useState(false)

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
      const response = await fetch('/api/products/size-groups')
      const result = await response.json()
      if (result.data) {
        setGroups(result.data)
      }
    } catch (error) {
      console.error('获取尺码组失败:', error)
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
        await fetch('/api/products/size-groups/reorder', {
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
      const response = await fetch('/api/products/size-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
        }),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        fetchGroups()
        setFormData({ name: '', code: '', codeLength: 2 })
      }
    } catch (error) {
      console.error('添加尺码组失败:', error)
    } finally {
      setSavingGroup(false)
    }
  }

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return

    setSavingGroup(true)
    try {
      const response = await fetch(`/api/products/size-groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
        }),
      })

      if (response.ok) {
        setIsEditDialogOpen(false)
        fetchGroups()
        setFormData({ name: '', code: '', codeLength: 2 })
        setEditingGroup(null)
      }
    } catch (error) {
      console.error('更新尺码组失败:', error)
    } finally {
      setSavingGroup(false)
    }
  }

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('确定要删除这个尺码组及其所有尺码吗？此操作不可恢复。')) return

    try {
      const response = await fetch(`/api/products/size-groups/${groupId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchGroups()
      }
    } catch (error) {
      console.error('删除尺码组失败:', error)
    }
  }

  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup) return

    setAddingSize(true)
    try {
      const response = await fetch('/api/products/size-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          name: valueFormData.name,
          code: valueFormData.code,
          sortOrder: (selectedGroup.size_values?.length || 0) + 1,
        }),
      })

      if (response.ok) {
        setIsValueDialogOpen(false)
        fetchGroups()
        setValueFormData({ name: '', code: '' })
      }
    } catch (error) {
      console.error('添加尺码失败:', error)
    } finally {
      setAddingSize(false)
    }
  }

  const handleEditSize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSize) return

    setSavingSize(true)
    try {
      const response = await fetch(`/api/products/size-values/${editingSize.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: valueFormData.name,
          code: valueFormData.code,
        }),
      })

      if (response.ok) {
        setIsEditValueDialogOpen(false)
        fetchGroups()
        setValueFormData({ name: '', code: '' })
        setEditingSize(null)
      }
    } catch (error) {
      console.error('更新尺码失败:', error)
    } finally {
      setSavingSize(false)
    }
  }

  const handleDeleteSize = async (sizeId: number) => {
    if (!confirm('确定要删除这个尺码吗？')) return

    try {
      const response = await fetch(`/api/products/size-values/${sizeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchGroups()
      }
    } catch (error) {
      console.error('删除尺码失败:', error)
    }
  }

  const handleMoveSize = async (groupId: number, sizeId: number, direction: 'up' | 'down') => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const sizes = [...(group.size_values || [])]
    const index = sizes.findIndex(s => s.id === sizeId)

    if (index < 0) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === sizes.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1

    const temp = sizes[index].sort_order
    sizes[index].sort_order = sizes[newIndex].sort_order
    sizes[newIndex].sort_order = temp

    try {
      await Promise.all([
        fetch(`/api/products/size-values/${sizes[index].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sizes[index].name,
            code: sizes[index].code,
          }),
        }),
        fetch(`/api/products/size-values/${sizes[newIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sizes[newIndex].name,
            code: sizes[newIndex].code,
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

  const updateGroupSortOrders = async (newGroups: SizeGroup[]) => {
    try {
      await Promise.all(
        newGroups.map((group, index) =>
          fetch(`/api/products/size-groups/${group.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: group.name,
              code: group.code,
              codeLength: group.code_length,
              sortOrder: index,
            }),
          })
        )
      )
      fetchGroups()
    } catch (error) {
      console.error('更新尺码组排序失败:', error)
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

  const openAddSizeDialog = (group: SizeGroup) => {
    setSelectedGroup(group)
    setValueFormData({
      name: '',
      code: '',
    })
    setIsValueDialogOpen(true)
  }

  const openEditSizeDialog = (size: SizeValue) => {
    setEditingSize(size)
    setValueFormData({
      name: size.name,
      code: size.code,
    })
    setIsEditValueDialogOpen(true)
  }

  const openEditGroupDialog = (group: SizeGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      code: group.code,
      codeLength: group.code_length,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">尺码组管理</h1>
        <p className="text-sm text-gray-500">配置尺码分类和具体尺码</p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center gap-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-6 font-medium shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
              <Plus className="h-5 w-5 mr-2" />
              添加尺码组
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">添加尺码组</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddGroup}>
              <div className="space-y-5 py-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">尺码系名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：男装尺码"
                    required
                    className="mt-2 h-11 rounded-xl border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="code" className="text-sm font-semibold text-gray-700">尺码系代码</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="例如：men"
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

      {/* Size Groups List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 表头 */}
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
          <div className="w-8" />
          <div className="w-7" />
          <div className="w-4" />
          <div className="flex-1">尺码系名称</div>
          <div className="w-20 text-center">尺码数量</div>
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
                <p className="text-gray-400 font-medium">暂无尺码组配置</p>
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
                  onAddSize={openAddSizeDialog}
                  onEditSize={openEditSizeDialog}
                  onDeleteSize={handleDeleteSize}
                  onMoveSize={handleMoveSize}
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
            <DialogTitle className="text-xl font-semibold">编辑尺码组</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditGroup}>
            <div className="space-y-5 py-4">
              <div>
                <Label htmlFor="editName" className="text-sm font-semibold text-gray-700">尺码系名称</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：男装尺码"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="editCode" className="text-sm font-semibold text-gray-700">尺码系代码</Label>
                <Input
                  id="editCode"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="例如：men"
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

      {/* Add Size Dialog */}
      <Dialog open={isValueDialogOpen} onOpenChange={setIsValueDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              添加尺码 - {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSize}>
            <div className="space-y-5 py-4">
              <div>
                <Label htmlFor="sizeName" className="text-sm font-semibold text-gray-700">尺码名称</Label>
                <Input
                  id="sizeName"
                  value={valueFormData.name}
                  onChange={(e) => setValueFormData({ ...valueFormData, name: e.target.value })}
                  placeholder="例如：S"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="sizeCode" className="text-sm font-semibold text-gray-700">尺码代码</Label>
                <Input
                  id="sizeCode"
                  value={valueFormData.code}
                  onChange={(e) => setValueFormData({ ...valueFormData, code: e.target.value })}
                  placeholder="例如：s"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsValueDialogOpen(false)} className="h-11 rounded-xl px-6">
                取消
              </Button>
              <Button type="submit" disabled={addingSize} className="h-11 rounded-xl px-6">
                {addingSize ? '添加中...' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Size Dialog */}
      <Dialog open={isEditValueDialogOpen} onOpenChange={setIsEditValueDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">编辑尺码</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSize}>
            <div className="space-y-5 py-4">
              <div>
                <Label htmlFor="editSizeName" className="text-sm font-semibold text-gray-700">尺码名称</Label>
                <Input
                  id="editSizeName"
                  value={valueFormData.name}
                  onChange={(e) => setValueFormData({ ...valueFormData, name: e.target.value })}
                  placeholder="例如：S"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="editSizeCode" className="text-sm font-semibold text-gray-700">尺码代码</Label>
                <Input
                  id="editSizeCode"
                  value={valueFormData.code}
                  onChange={(e) => setValueFormData({ ...valueFormData, code: e.target.value })}
                  placeholder="例如：s"
                  required
                  className="mt-2 h-11 rounded-xl border-gray-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsEditValueDialogOpen(false)
                setEditingSize(null)
              }} className="h-11 rounded-xl px-6">
                取消
              </Button>
              <Button type="submit" disabled={savingSize} className="h-11 rounded-xl px-6">
                {savingSize ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
