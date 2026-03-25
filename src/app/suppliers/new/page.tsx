'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface BasicField {
  id: number
  field_name: string
  display_name: string
  field_code: string
  field_type: 'text' | 'number' | 'select' | 'boolean' | 'textarea' | 'date'
  is_required: boolean
  sort_order: number
  enabled: boolean
  width: number
  columns: number
  column_width: number
  spacing: number
  row_index: number
  new_row: boolean
  group_sort_order: number
  group_id: number | null
  group_name: string | null
  group: { id: number; name: string } | null
  auto_generate: boolean
  code_rule_id: number | null
  options?: any
  default_value?: string
  // 关联商品属性
  linked_product_attribute_id?: number | null
  linked_product_attribute?: { id: number; name: string; code: string } | null
}

interface Attribute {
  id: number
  name: string
  code: string
  sort_order: number
  code_length: number
  enabled: boolean
  width: number
  columns: number
  column_width: number
  spacing: number
  row_index: number
  new_row: boolean
  group_sort_order: number
  is_required: boolean
  group_id: number | null
  group: { id: number; name: string } | null
  field_type?: string // single_select, text
  linked_product_attribute_id?: number | null
  supplier_attribute_values: AttributeValue[]
}

interface AttributeValue {
  id: number
  attribute_id: number
  name: string
  code: string
  sort_order: number
}

export default function AddSupplierPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // 基本信息字段
  const [basicFields, setBasicFields] = useState<BasicField[]>([])
  const [basicFieldValues, setBasicFieldValues] = useState<Record<string, any>>({})
  // 字段的自动生成开关状态
  const [fieldAutoGenerate, setFieldAutoGenerate] = useState<Record<string, boolean>>({})
  
  // 属性配置
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({})
  
  // 字段验证错误
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchBasicFields()
    fetchAttributes()
  }, [])

  // 获取基本信息字段
  const fetchBasicFields = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/suppliers/basic-fields')
      const result = await response.json()
      if (result.data) {
        // 只返回启用的字段，按分组sort_order和字段sort_order排序
        let enabledFields = result.data
          .filter((field: BasicField) => field.enabled !== false)
          .sort((a: BasicField, b: BasicField) => {
            // 先按分组的 sort_order 排序
            const aGroupSortOrder = a.group?.id ? (a.group_sort_order || 0) : 999999
            const bGroupSortOrder = b.group?.id ? (b.group_sort_order || 0) : 999999
            if (aGroupSortOrder !== bGroupSortOrder) {
              return aGroupSortOrder - bGroupSortOrder
            }
            // 同一分组内按 sort_order 排序
            return (a.sort_order || 0) - (b.sort_order || 0)
          })

        // 对于关联了商品属性的字段，获取商品属性的值列表
        const fieldsWithLinkedProduct = enabledFields.filter(
          (field: BasicField) => field.linked_product_attribute_id
        )

        if (fieldsWithLinkedProduct.length > 0) {
          // 获取商品属性值
          const productAttrsResponse = await fetch('/api/products/attributes')
          const productAttrsResult = await productAttrsResponse.json()
          
          if (productAttrsResult.data) {
            // 创建商品属性 ID 到属性值的映射
            const productAttrValuesMap: Record<number, any[]> = {}
            productAttrsResult.data.forEach((attr: any) => {
              if (attr.product_attribute_values) {
                productAttrValuesMap[attr.id] = attr.product_attribute_values
              }
            })

            // 更新字段，使用商品属性的值列表作为选项
            enabledFields = enabledFields.map((field: BasicField) => {
              if (field.linked_product_attribute_id && productAttrValuesMap[field.linked_product_attribute_id]) {
                // 使用商品属性的值列表作为选项
                const productValues = productAttrValuesMap[field.linked_product_attribute_id]
                return {
                  ...field,
                  options: productValues.map((v: any) => ({
                    label: v.name,
                    value: v.code
                  }))
                }
              }
              return field
            })
          }
        }
        
        setBasicFields(enabledFields)
        
        // 初始化自动生成状态
        const autoGenState: Record<string, boolean> = {}
        enabledFields.forEach((field: BasicField) => {
          if (field.auto_generate && field.code_rule_id) {
            autoGenState[field.field_code] = true
          }
        })
        setFieldAutoGenerate(autoGenState)
      }
    } catch (error) {
      console.error('获取基本信息字段失败:', error)
      toast({ variant: 'destructive', title: '加载失败', description: '无法加载基本信息字段' })
    } finally {
      setLoading(false)
    }
  }

  // 获取属性配置
  const fetchAttributes = async () => {
    try {
      const response = await fetch('/api/suppliers/attributes')
      const result = await response.json()
      if (result.data) {
        // 只返回启用的属性，按排序字段排序
        let enabledAttributes = result.data
          .filter((attr: Attribute) => attr.enabled !== false)
          .sort((a: Attribute, b: Attribute) => a.sort_order - b.sort_order)

        // 对于关联了商品属性的供应商属性，获取商品属性的值列表
        const attributesWithLinkedProduct = enabledAttributes.filter(
          (attr: Attribute) => attr.linked_product_attribute_id
        )

        if (attributesWithLinkedProduct.length > 0) {
          // 获取商品属性值
          const productAttrsResponse = await fetch('/api/products/attributes')
          const productAttrsResult = await productAttrsResponse.json()
          
          if (productAttrsResult.data) {
            // 创建商品属性 ID 到属性值的映射
            const productAttrValuesMap: Record<number, any[]> = {}
            productAttrsResult.data.forEach((attr: any) => {
              if (attr.product_attribute_values) {
                productAttrValuesMap[attr.id] = attr.product_attribute_values
              }
            })

            // 更新供应商属性，使用商品属性的值列表
            enabledAttributes = enabledAttributes.map((attr: Attribute) => {
              if (attr.linked_product_attribute_id && productAttrValuesMap[attr.linked_product_attribute_id]) {
                // 使用商品属性的值列表
                const productValues = productAttrValuesMap[attr.linked_product_attribute_id]
                return {
                  ...attr,
                  supplier_attribute_values: productValues.map((v: any) => ({
                    id: v.id,
                    attribute_id: attr.id,
                    name: v.name,
                    code: v.code,
                    sort_order: v.sort_order || 0
                  }))
                }
              }
              return attr
            })
          }
        }

        setAttributes(enabledAttributes)
      }
    } catch (error) {
      console.error('获取属性配置失败:', error)
    }
  }

  // 自动生成字段值
  const generateFieldValue = async (fieldCode: string, codeRuleId: number) => {
    try {
      const response = await fetch('/api/suppliers/generate-field-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_code: fieldCode,
          code_rule_id: codeRuleId,
          basic_field_values: basicFieldValues,
          attribute_values: attributeValues,
        }),
      })
      const result = await response.json()
      if (result.success) {
        setBasicFieldValues(prev => ({
          ...prev,
          [fieldCode]: result.data.value,
        }))
        toast({
          title: '生成成功',
          description: `已生成：${result.data.value}`,
        })
      } else {
        throw new Error(result.error || '生成失败')
      }
    } catch (error) {
      console.error(`生成字段值失败:`, error)
      toast({
        variant: 'destructive',
        title: '生成失败',
        description: '请检查配置是否完整',
      })
    }
  }

  // 渲染基本信息字段
  const renderBasicField = (field: BasicField) => {
    const isAutoGenerateEnabled = Boolean(field.auto_generate) && Boolean(field.code_rule_id)
    const autoGenerateState = fieldAutoGenerate[field.field_code] ?? isAutoGenerateEnabled
    const hasError = !!fieldErrors[field.field_code]

    const fieldLabel = (
      <Label htmlFor={`field-${field.id}`} className="text-xs text-gray-600 mb-1 block">
        {field.display_name || field.field_name}
        {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
    )

    switch (field.field_type) {
      case 'text':
        if (isAutoGenerateEnabled) {
          return (
            <div className="space-y-1">
              {fieldLabel}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Switch
                    id={`auto-${field.field_code}`}
                    checked={autoGenerateState}
                    onCheckedChange={(checked) => {
                      setFieldAutoGenerate(prev => ({
                        ...prev,
                        [field.field_code]: checked,
                      }))
                      if (checked && field.code_rule_id) {
                        generateFieldValue(field.field_code, field.code_rule_id)
                      }
                    }}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <Label htmlFor={`auto-${field.field_code}`} className="text-xs text-gray-500">
                    自动
                  </Label>
                </div>
                <Input
                  id={`field-${field.id}`}
                  value={basicFieldValues[field.field_code] || ''}
                  onChange={(e) => setBasicFieldValues(prev => ({
                    ...prev,
                    [field.field_code]: e.target.value,
                  }))}
                  disabled={autoGenerateState}
                  placeholder={autoGenerateState ? '自动生成' : `请输入${field.display_name || field.field_name}`}
                  className={`h-8 text-xs flex-1 ${hasError ? 'border-red-500' : ''} ${autoGenerateState ? 'bg-gray-100' : 'bg-white'}`}
                />
              </div>
              {hasError && <p className="text-xs text-red-500">{fieldErrors[field.field_code]}</p>}
            </div>
          )
        }
        return (
          <div className="space-y-1">
            {fieldLabel}
            <Input
              id={`field-${field.id}`}
              value={basicFieldValues[field.field_code] || ''}
              onChange={(e) => setBasicFieldValues(prev => ({
                ...prev,
                [field.field_code]: e.target.value,
              }))}
              placeholder={`请输入${field.display_name || field.field_name}`}
              className={`h-8 text-xs ${hasError ? 'border-red-500' : 'bg-white'}`}
            />
            {hasError && <p className="text-xs text-red-500">{fieldErrors[field.field_code]}</p>}
          </div>
        )

      case 'number':
        return (
          <div className="space-y-1">
            {fieldLabel}
            <Input
              id={`field-${field.id}`}
              type="number"
              value={basicFieldValues[field.field_code] || ''}
              onChange={(e) => setBasicFieldValues(prev => ({
                ...prev,
                [field.field_code]: e.target.value,
              }))}
              placeholder={`请输入${field.display_name || field.field_name}`}
              className={`h-8 text-xs ${hasError ? 'border-red-500' : 'bg-white'}`}
            />
            {hasError && <p className="text-xs text-red-500">{fieldErrors[field.field_code]}</p>}
          </div>
        )

      case 'select':
        const options = field.options || []
        return (
          <div className="space-y-1">
            {fieldLabel}
            <Select
              value={basicFieldValues[field.field_code] || ''}
              onValueChange={(value) => setBasicFieldValues(prev => ({
                ...prev,
                [field.field_code]: value,
              }))}
            >
              <SelectTrigger className={`h-8 text-xs ${hasError ? 'border-red-500' : 'bg-white'}`}>
                <SelectValue placeholder={`请选择${field.display_name || field.field_name}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt: any, idx: number) => (
                  <SelectItem key={idx} value={opt.value || opt} className="text-xs">
                    {opt.label || opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-xs text-red-500">{fieldErrors[field.field_code]}</p>}
          </div>
        )

      case 'boolean':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 pt-5">
              <Switch
                id={`field-${field.id}`}
                checked={basicFieldValues[field.field_code] === true || basicFieldValues[field.field_code] === 'true'}
                onCheckedChange={(checked) => setBasicFieldValues(prev => ({
                  ...prev,
                  [field.field_code]: checked,
                }))}
                className="data-[state=checked]:bg-green-500"
              />
              <Label htmlFor={`field-${field.id}`} className="text-xs text-gray-600">
                {field.display_name || field.field_name}
              </Label>
            </div>
          </div>
        )

      case 'textarea':
        return (
          <div className="space-y-1">
            {fieldLabel}
            <Textarea
              id={`field-${field.id}`}
              value={basicFieldValues[field.field_code] || ''}
              onChange={(e) => setBasicFieldValues(prev => ({
                ...prev,
                [field.field_code]: e.target.value,
              }))}
              placeholder={`请输入${field.display_name || field.field_name}`}
              className={`text-xs ${hasError ? 'border-red-500' : 'bg-white'}`}
              rows={3}
            />
            {hasError && <p className="text-xs text-red-500">{fieldErrors[field.field_code]}</p>}
          </div>
        )

      case 'date':
        return (
          <div className="space-y-1">
            {fieldLabel}
            <Input
              id={`field-${field.id}`}
              type="date"
              value={basicFieldValues[field.field_code] || ''}
              onChange={(e) => setBasicFieldValues(prev => ({
                ...prev,
                [field.field_code]: e.target.value,
              }))}
              className={`h-8 text-xs ${hasError ? 'border-red-500' : 'bg-white'}`}
            />
            {hasError && <p className="text-xs text-red-500">{fieldErrors[field.field_code]}</p>}
          </div>
        )

      default:
        return null
    }
  }

  // 渲染属性字段
  const renderAttribute = (attr: Attribute) => {
    const hasError = !!fieldErrors[`attr_${attr.code}`]

    const attrLabel = (
      <Label className="text-xs text-gray-600 mb-1 block">
        {attr.name}
        {attr.is_required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
    )

    // 文本类型渲染为输入框
    if (attr.field_type === 'text') {
      return (
        <div key={attr.id} className="space-y-1">
          {attrLabel}
          <Input
            value={attributeValues[attr.code] || ''}
            onChange={(e) => setAttributeValues(prev => ({
              ...prev,
              [attr.code]: e.target.value,
            }))}
            placeholder={`请输入${attr.name}`}
            className={`h-8 text-xs ${hasError ? 'border-red-500' : 'bg-white'}`}
          />
          {hasError && <p className="text-xs text-red-500">{fieldErrors[`attr_${attr.code}`]}</p>}
        </div>
      )
    }

    // 单选类型渲染为下拉选择
    return (
      <div key={attr.id} className="space-y-1">
        {attrLabel}
        <Select
          value={attributeValues[attr.code] || ''}
          onValueChange={(value) => setAttributeValues(prev => ({
            ...prev,
            [attr.code]: value,
          }))}
        >
          <SelectTrigger className={`h-8 text-xs ${hasError ? 'border-red-500' : 'bg-white'}`}>
            <SelectValue placeholder={`请选择${attr.name}`} />
          </SelectTrigger>
          <SelectContent>
            {attr.supplier_attribute_values?.map((val) => (
              <SelectItem key={val.id} value={val.code} className="text-xs">
                {val.name} ({val.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasError && <p className="text-xs text-red-500">{fieldErrors[`attr_${attr.code}`]}</p>}
      </div>
    )
  }

  // 按分组渲染基本信息
  const renderBasicFieldsByGroup = () => {
    // 按分组归类
    const groupedFields: Record<string, BasicField[]> = {}
    
    basicFields.forEach(field => {
      const groupName = field.group?.name || '基本信息'
      if (!groupedFields[groupName]) {
        groupedFields[groupName] = []
      }
      groupedFields[groupName].push(field)
    })

    return (
      <div className="space-y-4">
        {Object.entries(groupedFields).map(([groupName, fields]) => {
          // 按行分组
          const fieldsByRow: Record<number, BasicField[]> = {}
          fields.forEach(field => {
            const rowIndex = field.row_index || 1
            if (!fieldsByRow[rowIndex]) {
              fieldsByRow[rowIndex] = []
            }
            fieldsByRow[rowIndex].push(field)
          })

          // 对每一行的字段按 sort_order 排序
          Object.keys(fieldsByRow).forEach(rowIndex => {
            fieldsByRow[parseInt(rowIndex)].sort((a, b) => a.sort_order - b.sort_order)
          })

          return (
            <Card key={groupName} className="border-gray-200">
              <CardHeader className="py-3 px-4 border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-sm font-medium text-gray-700">{groupName}</CardTitle>
              </CardHeader>
              <CardContent className="py-4 px-4">
                <div className="space-y-3">
                  {Object.entries(fieldsByRow).map(([rowIndex, rowFields]) => {
                    // 分离需要单独一行的字段
                    const normalFields = rowFields.filter(f => !f.new_row)
                    const newRowFields = rowFields.filter(f => f.new_row)

                    return (
                      <div key={rowIndex}>
                        {normalFields.length > 0 && (
                          <div 
                            className="grid gap-x-4 gap-y-3"
                            style={{
                              gridTemplateColumns: `repeat(${normalFields[0]?.columns || 4}, minmax(0, 1fr))`,
                            }}
                          >
                            {normalFields.map(field => (
                              <div 
                                key={field.id}
                                style={{ gridColumn: `span ${field.column_width || 1}` }}
                              >
                                {renderBasicField(field)}
                              </div>
                            ))}
                          </div>
                        )}
                        {newRowFields.map(field => (
                          <div key={field.id} className="mt-3">
                            {renderBasicField(field)}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // 按布局渲染属性
  const renderAttributesByLayout = () => {
    if (attributes.length === 0) return null

    // 按 row_index 分组
    const attributesByRow: Record<number, Attribute[]> = {}
    attributes.forEach(attr => {
      const rowIndex = attr.row_index || 1
      if (!attributesByRow[rowIndex]) {
        attributesByRow[rowIndex] = []
      }
      attributesByRow[rowIndex].push(attr)
    })

    // 对每一行的属性按 sort_order 排序
    Object.keys(attributesByRow).forEach(rowIndex => {
      attributesByRow[parseInt(rowIndex)].sort((a, b) => a.sort_order - b.sort_order)
    })

    return (
      <Card className="border-gray-200">
        <CardHeader className="py-3 px-4 border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-sm font-medium text-gray-700">供应商属性</CardTitle>
        </CardHeader>
        <CardContent className="py-4 px-4">
          <div className="space-y-3">
            {Object.entries(attributesByRow).map(([rowIndex, attrs]) => {
              const normalAttrs = attrs.filter(a => !a.new_row)
              const newRowAttrs = attrs.filter(a => a.new_row)

              return (
                <div key={rowIndex}>
                  {normalAttrs.length > 0 && (
                    <div 
                      className="grid gap-x-4 gap-y-3"
                      style={{
                        gridTemplateColumns: `repeat(${normalAttrs[0]?.columns || 4}, minmax(0, 1fr))`,
                      }}
                    >
                      {normalAttrs.map(attr => (
                        <div 
                          key={attr.id}
                          style={{ gridColumn: `span ${attr.column_width || 1}` }}
                        >
                          {renderAttribute(attr)}
                        </div>
                      ))}
                    </div>
                  )}
                  {newRowAttrs.map(attr => (
                    <div key={attr.id} className="mt-3">
                      {renderAttribute(attr)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 验证必填字段
  const validateFields = (): boolean => {
    const errors: Record<string, string> = {}

    // 验证基本信息必填字段
    basicFields.forEach(field => {
      if (field.is_required) {
        const value = basicFieldValues[field.field_code]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors[field.field_code] = `${field.display_name || field.field_name}为必填项`
        }
      }
    })

    // 验证属性必填字段
    attributes.forEach(attr => {
      if (attr.is_required) {
        const value = attributeValues[attr.code]
        if (!value) {
          errors[`attr_${attr.code}`] = `${attr.name}为必填项`
        }
      }
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 保存供应商
  const handleSave = async () => {
    if (!validateFields()) {
      toast({
        variant: 'destructive',
        title: '验证失败',
        description: '请填写所有必填项',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicInfo: basicFieldValues,
          attributes: attributeValues,
        }),
      })

      const result = await response.json()
      
      if (result.success || result.data) {
        toast({
          title: '保存成功',
          description: '供应商信息已保存',
        })
        router.push('/suppliers')
      } else {
        throw new Error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存供应商失败:', error)
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/suppliers')}
              className="h-8"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">添加供应商</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-8 bg-blue-500 hover:bg-blue-600"
            >
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* 基本信息 */}
        {renderBasicFieldsByGroup()}
        
        {/* 供应商属性 */}
        {renderAttributesByLayout()}
      </div>
    </div>
  )
}
