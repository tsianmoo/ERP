'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface SupplierBasicField {
  id: number
  field_name: string
  field_code: string
  field_type: string
  is_required: boolean
  options: any
  sort_order: number
}

export default function SupplierAttributesPage() {
  const [fields, setFields] = useState<SupplierBasicField[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<SupplierBasicField | null>(null)
  const [formData, setFormData] = useState({
    fieldName: '',
    fieldCode: '',
    fieldType: 'text',
    isRequired: false,
    options: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchFields()
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const options = formData.fieldType === 'select' 
        ? formData.options.split('\n').map((opt: string) => {
            const [label, value] = opt.split(':').map(s => s.trim())
            return { label: label || value, value: value || label }
          })
        : null

      const payload = {
        ...formData,
        options,
        sortOrder: editingField ? editingField.sort_order : fields.length,
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
        throw new Error('操作失败')
      }
    } catch (error) {
      console.error('保存字段失败:', error)
      toast({
        variant: 'destructive',
        title: '操作失败',
        description: '请重试',
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/suppliers/basic-fields/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setFields(fields.filter(f => f.id !== id))
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

  const handleEdit = (field: SupplierBasicField) => {
    setEditingField(field)
    setFormData({
      fieldName: field.field_name,
      fieldCode: field.field_code,
      fieldType: field.field_type,
      isRequired: field.is_required,
      options: field.options 
        ? field.options.map((opt: any) => `${opt.label}:${opt.value}`).join('\n')
        : '',
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      fieldName: '',
      fieldCode: '',
      fieldType: 'text',
      isRequired: false,
      options: '',
    })
    setEditingField(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">供应商属性配置</h1>
        <p className="text-gray-600 text-sm">配置供应商基本信息字段，支持自定义字段和排序</p>
      </div>

      {/* Actions */}
      <div className="mb-6">
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
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="fieldName">字段名称</Label>
                  <Input
                    id="fieldName"
                    value={formData.fieldName}
                    onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                    placeholder="例如：联系人"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fieldCode">字段代码</Label>
                  <Input
                    id="fieldCode"
                    value={formData.fieldCode}
                    onChange={(e) => setFormData({ ...formData, fieldCode: e.target.value })}
                    placeholder="例如：contact"
                    required
                  />
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isRequired"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked as boolean })}
                  />
                  <Label htmlFor="isRequired">必填字段</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fields List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">字段名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">字段代码</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">字段类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">必填</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排序</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fields.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  暂无字段配置
                </td>
              </tr>
            ) : (
              fields.map((field) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{field.field_name}</td>
                  <td className="px-6 py-4 text-gray-600">{field.field_code}</td>
                  <td className="px-6 py-4 text-gray-600">{field.field_type}</td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4 text-gray-600">{field.sort_order}</td>
                  <td className="px-6 py-4 text-right">
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
  )
}
