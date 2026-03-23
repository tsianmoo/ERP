'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

interface SupplierBasicField {
  id: number
  field_name: string
  display_name: string | null
  field_code: string
  field_type: string
  is_required: boolean
  options: any
  default_value: string | null
  sort_order: number
  enabled: boolean
}

export default function SupplierBasicInfoPage() {
  const [fields, setFields] = useState<SupplierBasicField[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<SupplierBasicField | null>(null)
  const [formData, setFormData] = useState({
    fieldName: '',
    displayName: '',
    fieldCode: '',
    fieldType: 'text',
    isRequired: false,
    options: '',
    defaultValue: '',
    enabled: true,
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

  // 自动生成字段代码
  const generateFieldCode = (fieldName: string): string => {
    if (!fieldName) return ''
    
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
    
    // 检查是否在常用映射表中
    if (commonChineseMap[fieldName]) {
      return commonChineseMap[fieldName]
    }
    
    // 简单的拼音转换
    let result = fieldName.toLowerCase()
    result = result.replace(/[\s\-–—]+/g, '_')
    result = result.replace(/[^a-z0-9_]/g, '_')
    result = result.replace(/_{2,}/g, '_')
    result = result.replace(/^_+|_+$/g, '')
    
    return result || 'custom_field'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let options = null
      if (formData.fieldType === 'select') {
        options = formData.options.split('\n').map((opt: string) => {
          const [label, value] = opt.split(':').map(s => s.trim())
          return { label: label || value, value: value || label }
        })
      } else if (formData.fieldType === 'boolean') {
        // 布尔值类型，设置默认选项
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

  const handleEdit = (field: SupplierBasicField) => {
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
    })
    setIsDialogOpen(true)
  }

  // 切换启用状态
  const handleToggleEnabled = async (field: SupplierBasicField) => {
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
  const handleMoveUp = async (field: SupplierBasicField, index: number) => {
    if (index === 0) return
    
    const prevField = fields[index - 1]
    const currentSortOrder = field.sort_order
    const prevSortOrder = prevField.sort_order
    
    // 交换排序
    await Promise.all([
      fetch(`/api/suppliers/basic-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: prevSortOrder }),
      }),
      fetch(`/api/suppliers/basic-fields/${prevField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: currentSortOrder }),
      })
    ])
    
    fetchFields()
  }

  const handleMoveDown = async (field: SupplierBasicField, index: number) => {
    if (index === fields.length - 1) return
    
    const nextField = fields[index + 1]
    const currentSortOrder = field.sort_order
    const nextSortOrder = nextField.sort_order
    
    // 交换排序
    await Promise.all([
      fetch(`/api/suppliers/basic-fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: nextSortOrder }),
      }),
      fetch(`/api/suppliers/basic-fields/${nextField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: currentSortOrder }),
      })
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

  // 按排序顺序过滤字段
  const sortedFields = useMemo(() => {
    return [...fields].sort((a, b) => a.sort_order - b.sort_order)
  }, [fields])

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
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">基本信息管理</h1>
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
                  <Label htmlFor="fieldName">字段名称 <span className="text-red-500">*</span></Label>
                  <Input
                    id="fieldName"
                    value={formData.fieldName}
                    onChange={(e) => {
                      const name = e.target.value
                      setFormData({ 
                        ...formData, 
                        fieldName: name,
                        // 自动生成字段代码
                        fieldCode: formData.fieldCode || generateFieldCode(name),
                        // 自动填充显示名称
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
                    placeholder="显示在页面上的名称，默认与字段名称相同"
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
                  <p className="text-xs text-gray-500 mt-1">用于数据存储的唯一标识，建议使用英文</p>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">序号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">字段名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">显示名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">字段代码</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">字段类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">必填</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">启用</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">排序</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedFields.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  暂无字段配置
                </td>
              </tr>
            ) : (
              sortedFields.map((field, index) => (
                <tr key={field.id} className={`hover:bg-gray-50 ${!field.enabled ? 'bg-gray-100 opacity-60' : ''}`}>
                  <td className="px-4 py-4">
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  </td>
                  <td className="px-4 py-4 text-gray-600">{index + 1}</td>
                  <td className="px-4 py-4 font-medium text-gray-900">{field.field_name}</td>
                  <td className="px-4 py-4 text-gray-600">{field.display_name || field.field_name}</td>
                  <td className="px-4 py-4 text-gray-600 font-mono text-xs">{field.field_code}</td>
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
                        disabled={index === sortedFields.length - 1}
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
  )
}
