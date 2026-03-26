'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Plus, Edit, Trash2, Save, GripVertical, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface CodeElement {
  id: string
  type: 'fixed' | 'variable'
  value: string
  enabled: boolean
  sort_order: number
  sequence_length?: number
  sequence_excluded_digits?: string
}

interface CodeRule {
  id: number
  rule_name: string
  elements: CodeElement[]
  barcode_elements: CodeElement[]
  barcode_enabled: boolean
  barcode_suffix: string
  is_active: boolean
}

interface Variable {
  value: string
  label: string
  description: string
  type?: string
}

interface VariablesData {
  builtIn: Variable[]
  basicFields: Variable[]
  attributes: Variable[]
}

export default function CodeRulesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [rules, setRules] = useState<CodeRule[]>([])
  const [loading, setLoading] = useState(true)
  const [variables, setVariables] = useState<VariablesData>({ builtIn: [], basicFields: [], attributes: [] })
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CodeRule | null>(null)
  const [formData, setFormData] = useState({
    ruleName: '',
    elements: [] as CodeElement[],
    barcodeElements: [] as CodeElement[],
    barcodeEnabled: false,
    barcodeSuffix: '',
    isActive: true,
  })

  // 拖拽相关状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragNodeRef = useRef<HTMLDivElement | null>(null)
  
  // 条码拖拽状态
  const [barcodeDraggedIndex, setBarcodeDraggedIndex] = useState<number | null>(null)
  const [barcodeDragOverIndex, setBarcodeDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchRules()
    fetchVariables()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products/code-rules')
      const result = await response.json()
      if (result.data) {
        setRules(result.data)
      }
    } catch (error) {
      console.error('获取编码规则失败:', error)
      toast({ variant: 'destructive', title: '获取失败', description: '无法加载编码规则' })
    } finally {
      setLoading(false)
    }
  }

  const fetchVariables = async () => {
    try {
      const response = await fetch('/api/products/code-rules/variables')
      const result = await response.json()
      if (result.data) {
        setVariables(result.data)
      }
    } catch (error) {
      console.error('获取变量列表失败:', error)
    }
  }

  const openCreateDialog = () => {
    setEditingRule(null)
    setFormData({
      ruleName: '',
      elements: [{ id: `element-${Date.now()}`, type: 'fixed', value: '', enabled: true, sort_order: 0 }],
      barcodeElements: [
        { id: `barcode-element-${Date.now()}`, type: 'variable', value: 'base_code', enabled: true, sort_order: 0 },
        { id: `barcode-element-${Date.now() + 1}`, type: 'variable', value: 'color_code', enabled: true, sort_order: 1 },
        { id: `barcode-element-${Date.now() + 2}`, type: 'variable', value: 'size_code', enabled: true, sort_order: 2 },
      ],
      barcodeEnabled: true,
      barcodeSuffix: '',
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (rule: CodeRule) => {
    setEditingRule(rule)
    setFormData({
      ruleName: rule.rule_name,
      elements: rule.elements || [],
      barcodeElements: rule.barcode_elements || [],
      barcodeEnabled: rule.barcode_enabled ?? false,
      barcodeSuffix: rule.barcode_suffix || '',
      isActive: rule.is_active ?? true,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.ruleName.trim()) {
      toast({ variant: 'destructive', title: '验证失败', description: '请输入规则名称' })
      return
    }

    try {
      const url = editingRule 
        ? `/api/products/code-rules/${editingRule.id}`
        : '/api/products/code-rules'
      const method = editingRule ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleName: formData.ruleName,
          elements: formData.elements,
          barcodeElements: formData.barcodeElements,
          barcodeEnabled: formData.barcodeEnabled,
          barcodeSuffix: formData.barcodeSuffix,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        toast({ title: editingRule ? '更新成功' : '创建成功' })
        setIsDialogOpen(false)
        fetchRules()
      } else {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }
    } catch (error) {
      toast({ variant: 'destructive', title: '操作失败', description: String(error) })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个编码规则吗？')) return

    try {
      const response = await fetch(`/api/products/code-rules/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: '删除成功' })
        fetchRules()
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      toast({ variant: 'destructive', title: '删除失败' })
    }
  }

  const addElement = () => {
    setFormData(prev => ({
      ...prev,
      elements: [...prev.elements, {
        id: `element-${Date.now()}`,
        type: 'fixed',
        value: '',
        enabled: true,
        sort_order: prev.elements.length,
      }],
    }))
  }

  const removeElement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.filter(e => e.id !== id).map((e, i) => ({ ...e, sort_order: i })),
    }))
  }

  const updateElement = (id: string, field: keyof CodeElement, value: any) => {
    setFormData(prev => ({
      ...prev,
      elements: prev.elements.map(e => e.id === id ? { ...e, [field]: value } : e),
    }))
  }

  const addBarcodeElement = () => {
    setFormData(prev => ({
      ...prev,
      barcodeElements: [...prev.barcodeElements, {
        id: `barcode-element-${Date.now()}`,
        type: 'variable',
        value: '',
        enabled: true,
        sort_order: prev.barcodeElements.length,
      }],
    }))
  }

  const removeBarcodeElement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      barcodeElements: prev.barcodeElements.filter(e => e.id !== id).map((e, i) => ({ ...e, sort_order: i })),
    }))
  }

  const updateBarcodeElement = (id: string, field: keyof CodeElement, value: any) => {
    setFormData(prev => ({
      ...prev,
      barcodeElements: prev.barcodeElements.map(e => e.id === id ? { ...e, [field]: value } : e),
    }))
  }

  const allVariables = [...variables.builtIn, ...variables.basicFields, ...variables.attributes]

  const getVariableLabel = (code: string): string => {
    const variable = allVariables.find(v => v.value === code)
    return variable ? variable.label : code
  }

  const formatElementsPreview = (elements: CodeElement[] | undefined): string => {
    if (!elements) return '-'
    return elements
      .filter(e => e.enabled)
      .map(e => e.type === 'fixed' ? e.value : `{${getVariableLabel(e.value)}}`)
      .join('') || '-'
  }

  const previewCode = () => {
    return formData.elements
      .filter(e => e.enabled)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(e => e.type === 'fixed' ? e.value : `[${getVariableLabel(e.value)}]`)
      .join('')
  }

  const previewBarcode = () => {
    return formData.barcodeElements
      .filter(e => e.enabled)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(e => e.type === 'fixed' ? e.value : `[${getVariableLabel(e.value)}]`)
      .join('')
  }

  // 拖拽开始（编码元素）
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  // 拖拽进入
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  // 拖拽结束
  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // 放置（编码元素）
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newElements = [...formData.elements]
    const [draggedElement] = newElements.splice(draggedIndex, 1)
    newElements.splice(dropIndex, 0, draggedElement)
    
    const updatedElements = newElements.map((el, i) => ({ ...el, sort_order: i }))
    setFormData(prev => ({ ...prev, elements: updatedElements }))
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // 条码拖拽开始
  const handleBarcodeDragStart = (e: React.DragEvent, index: number) => {
    setBarcodeDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  // 条码拖拽进入
  const handleBarcodeDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setBarcodeDragOverIndex(index)
  }

  // 条码拖拽结束
  const handleBarcodeDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setBarcodeDraggedIndex(null)
    setBarcodeDragOverIndex(null)
  }

  // 条码放置
  const handleBarcodeDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (barcodeDraggedIndex === null || barcodeDraggedIndex === dropIndex) return

    const newElements = [...formData.barcodeElements]
    const [draggedElement] = newElements.splice(barcodeDraggedIndex, 1)
    newElements.splice(dropIndex, 0, draggedElement)
    
    const updatedElements = newElements.map((el, i) => ({ ...el, sort_order: i }))
    setFormData(prev => ({ ...prev, barcodeElements: updatedElements }))
    setBarcodeDraggedIndex(null)
    setBarcodeDragOverIndex(null)
  }

  // 渲染元素项
  const renderElementItem = (
    element: CodeElement,
    index: number,
    onUpdate: (id: string, field: keyof CodeElement, value: any) => void,
    onRemove: (id: string) => void,
    canRemove: boolean,
    showSequenceConfig: boolean = true,
    isBarcode: boolean = false
  ) => {
    const currentDraggedIndex = isBarcode ? barcodeDraggedIndex : draggedIndex
    const currentDragOverIndex = isBarcode ? barcodeDragOverIndex : dragOverIndex
    
    return (
      <div 
        key={element.id} 
        className={`group border-b last:border-b-0 ${currentDraggedIndex === index ? 'opacity-50' : ''} ${currentDragOverIndex === index && currentDraggedIndex !== index ? 'border-t-2 border-t-blue-400' : ''}`}
        draggable
        onDragStart={(e) => isBarcode ? handleBarcodeDragStart(e, index) : handleDragStart(e, index)}
        onDragOver={(e) => isBarcode ? handleBarcodeDragOver(e, index) : handleDragOver(e, index)}
        onDragEnd={isBarcode ? handleBarcodeDragEnd : handleDragEnd}
        onDrop={(e) => isBarcode ? handleBarcodeDrop(e, index) : handleDrop(e, index)}
      >
        <div className="flex items-center gap-3 py-3">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 hover:text-gray-600" />
          <Switch
            checked={element.enabled}
            onCheckedChange={checked => onUpdate(element.id, 'enabled', checked)}
          />
          <Select
            value={element.type}
            onValueChange={value => onUpdate(element.id, 'type', value)}
          >
            <SelectTrigger className="w-28 flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">固定字符</SelectItem>
              <SelectItem value="variable">变量</SelectItem>
            </SelectContent>
          </Select>
          {element.type === 'fixed' ? (
            <Input
              value={element.value}
              onChange={e => onUpdate(element.id, 'value', e.target.value)}
              placeholder="固定字符"
              className="flex-1 min-w-0"
            />
          ) : (
            <Select
              value={element.value}
              onValueChange={value => onUpdate(element.id, 'value', value)}
            >
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="选择变量" />
              </SelectTrigger>
              <SelectContent>
                {variables.builtIn.map(v => (
                  <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                ))}
                {variables.basicFields.length > 0 && (
                  <>
                    <SelectItem value="__separator_basic__" disabled>── 基本信息 ──</SelectItem>
                    {variables.basicFields.map(v => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </>
                )}
                {variables.attributes.length > 0 && (
                  <>
                    <SelectItem value="__separator_attributes__" disabled>── 商品属性 ──</SelectItem>
                    {variables.attributes.map(v => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-red-500"
            onClick={() => onRemove(element.id)}
            disabled={canRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 流水号配置 */}
        {showSequenceConfig && element.type === 'variable' && element.value === 'sequence' && element.enabled && (
          <div className="pl-14 pr-10 pb-3">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded border">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Label className="text-xs text-gray-500">位数</Label>
                <Select
                value={String(element.sequence_length || 3)}
                onValueChange={value => onUpdate(element.id, 'sequence_length', parseInt(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}位</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Label className="text-xs text-gray-500 flex-shrink-0">排除数字</Label>
              <Input
                value={element.sequence_excluded_digits || ''}
                onChange={e => onUpdate(element.id, 'sequence_excluded_digits', e.target.value)}
                placeholder="如：4,7"
                className="flex-1 min-w-0 h-8"
              />
            </div>
          </div>
        </div>
      )}
    </div>
    )
  }

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-xl font-medium">编码规则管理</h1>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          新增规则
        </Button>
      </div>

      {/* 规则列表 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border rounded-lg">
          暂无编码规则，点击"新增规则"创建
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{rule.rule_name}</span>
                  {rule.is_active ? (
                    <Badge variant="secondary" className="bg-green-50 text-green-700">启用</Badge>
                  ) : (
                    <Badge variant="secondary">禁用</Badge>
                  )}
                  {rule.barcode_enabled && (
                    <Badge variant="outline">条码规则</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(rule)}>
                    <Edit className="h-4 w-4 mr-1" />
                    编辑
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(rule.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500 flex gap-6">
                <span>货号格式：<code className="px-2 py-0.5 bg-gray-100 rounded text-xs">{formatElementsPreview(rule.elements)}</code></span>
                {rule.barcode_enabled && (
                  <span>条码格式：<code className="px-2 py-0.5 bg-gray-100 rounded text-xs">{formatElementsPreview(rule.barcode_elements)}</code></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 编辑弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !p-0 !translate-x-0 !translate-y-0 flex flex-col bg-gray-50" 
          showCloseButton={false}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b flex-shrink-0">
            <DialogTitle className="text-lg font-medium">
              {editingRule ? '编辑编码规则' : '新增编码规则'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* 左侧：基本信息 + 货号规则 */}
              <div className="flex flex-col gap-4">
                {/* 基本信息 */}
                <div className="bg-white border rounded-lg p-4 flex-shrink-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">规则名称 <span className="text-red-400">*</span></Label>
                      <Input
                        value={formData.ruleName}
                        onChange={e => setFormData(prev => ({ ...prev, ruleName: e.target.value }))}
                        placeholder="如：默认货号规则"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end pb-0.5">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label className="text-sm">{formData.isActive ? '已启用' : '已禁用'}</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 货号编码规则 */}
                <div className="bg-white border rounded-lg flex-1 flex flex-col min-h-0">
                  <div className="px-4 py-3 border-b flex-shrink-0">
                    <h3 className="font-medium">货号编码规则</h3>
                    <p className="text-xs text-gray-500 mt-0.5">配置货号的自动生成规则</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto px-4">
                    {formData.elements.map((element, index) => 
                      renderElementItem(element, index, updateElement, removeElement, formData.elements.length === 1, true, false)
                    )}
                  </div>
                  
                  <div className="px-4 py-3 border-t flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={addElement} className="w-full">
                      <Plus className="h-4 w-4 mr-1" /> 添加元素
                    </Button>
                  </div>
                  
                  <div className="px-4 py-2 bg-gray-50 border-t text-sm flex-shrink-0">
                    <span className="text-gray-400">预览：</span>
                    <code className="ml-2 px-2 py-0.5 bg-white border rounded text-xs">{previewCode()}</code>
                  </div>
                </div>
              </div>

              {/* 右侧：条码规则 */}
              <div className="flex flex-col">
                {/* 条码编码规则 */}
                <div className="bg-white border rounded-lg flex-1 flex flex-col min-h-0">
                  <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
                    <div>
                      <h3 className="font-medium">条码编码规则</h3>
                      <p className="text-xs text-gray-500 mt-0.5">配置条码的自动生成规则</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.barcodeEnabled}
                        onCheckedChange={checked => setFormData(prev => ({ ...prev, barcodeEnabled: checked }))}
                      />
                      <Label className="text-sm">{formData.barcodeEnabled ? '启用' : '禁用'}</Label>
                    </div>
                  </div>
                  
                  {formData.barcodeEnabled ? (
                    <>
                      <div className="flex-1 overflow-y-auto px-4">
                        {formData.barcodeElements.map((element, index) => 
                          renderElementItem(element, index, updateBarcodeElement, removeBarcodeElement, formData.barcodeElements.length === 1, false, true)
                        )}
                      </div>
                      
                      <div className="px-4 py-3 border-t flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={addBarcodeElement} className="w-full">
                          <Plus className="h-4 w-4 mr-1" /> 添加元素
                        </Button>
                      </div>
                      
                      <div className="px-4 py-2 bg-gray-50 border-t text-sm flex-shrink-0">
                        <span className="text-gray-400">预览：</span>
                        <code className="ml-2 px-2 py-0.5 bg-white border rounded text-xs">{previewBarcode()}</code>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                      开启开关以配置条码规则
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 底部 */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-white border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
