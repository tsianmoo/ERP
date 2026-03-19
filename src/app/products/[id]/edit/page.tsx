'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Upload, X, Loader2, Lock, Plus, Eye, Edit2, Trash2, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ColorSelector, SelectedColor } from '@/components/products/color-selector'
import { ImageSelector } from '@/components/images/image-selector'

interface BarcodeElement {
  id: string
  type: 'fixed' | 'variable'
  value: string
  enabled: boolean
  sort_order: number
}

interface BarcodeRule {
  id: number
  ruleName: string
  barcodeElements: BarcodeElement[]
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // 基本信息字段
  const [basicFields, setBasicFields] = useState<any[]>([])
  const [basicFieldValues, setBasicFieldValues] = useState<Record<string, any>>({})
  // 字段验证错误
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // 属性配置
  const [attributes, setAttributes] = useState<any[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({})
  
  // 颜色和尺码
  const [colorGroups, setColorGroups] = useState<any[]>([])
  const [sizeGroups, setSizeGroups] = useState<any[]>([])
  const [selectedColors, setSelectedColors] = useState<number[]>([])
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  
  // 完整的颜色选择信息（ColorSelector 使用）
  const [selectedColorDetails, setSelectedColorDetails] = useState<SelectedColor[]>([])
  // 选中的尺码ID列表
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([])
  // 从 API 返回的尺码详细信息
  const [productSizes, setProductSizes] = useState<any[]>([])
  // 从 API 返回的颜色详细信息
  const [productColors, setProductColors] = useState<any[]>([])
  
  // 颜色别名映射
  const [colorAliases, setColorAliases] = useState<Record<number, string>>({})
  
  // 条码规则
  const [barcodeRule, setBarcodeRule] = useState<BarcodeRule | null>(null)
  
  // SKU多条码管理 - key为 `${colorValueId}-${sizeId}`，value为条码数组
  const [skuBarcodes, setSkuBarcodes] = useState<Record<string, string[]>>({})
  
  // 条码弹窗状态
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false)
  const [barcodeDialogMode, setBarcodeDialogMode] = useState<'view' | 'add' | 'edit'>('view')
  const [currentSkuKey, setCurrentSkuKey] = useState<string>('')
  const [currentMainBarcode, setCurrentMainBarcode] = useState<string>('')
  const [editingBarcodeIndex, setEditingBarcodeIndex] = useState<number>(-1)
  const [newBarcodeValue, setNewBarcodeValue] = useState<string>('')
  
  // 供应商列表
  const [suppliers, setSuppliers] = useState<any[]>([])
  
  // 图片
  const [images, setImages] = useState<string[]>([])
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false)

  // 商品状态
  const [status, setStatus] = useState('active')

  useEffect(() => {
    if (params.id) {
      fetchProduct()
      fetchBasicFields()
      fetchAttributes()
      fetchColors()
      fetchSizes()
      fetchSuppliers()
    }
  }, [params.id])

  // 根据条码规则生成条码
  const generateBarcode = (
    productCode: string,
    colorCode: string,
    colorGroupCode: string,
    sizeCode: string,
    sizeGroupCode: string
  ): string => {
    if (!barcodeRule || !barcodeRule.barcodeElements || barcodeRule.barcodeElements.length === 0) {
      // 默认条码格式：货号 + 颜色编码 + 尺码编码
      return productCode ? `${productCode}${colorCode}${sizeCode}` : '-'
    }

    const enabledElements = barcodeRule.barcodeElements
      .filter(el => el.enabled)
      .sort((a, b) => a.sort_order - b.sort_order)

    let barcode = ''
    enabledElements.forEach(element => {
      if (element.type === 'fixed') {
        barcode += element.value
      } else {
        switch (element.value) {
          case 'base_code':
            barcode += productCode
            break
          case 'color_code':
            barcode += colorCode
            break
          case 'color_group_code':
            barcode += colorGroupCode
            break
          case 'size_code':
            barcode += sizeCode
            break
          case 'size_group_code':
            barcode += sizeGroupCode
            break
          default:
            // 尝试从基本信息或属性中获取
            barcode += basicFieldValues[element.value] || attributeValues[element.value] || ''
        }
      }
    })

    return barcode || '-'
  }

  // 获取商品详情
  const fetchProduct = async () => {
    try {
      setFetching(true)
      const response = await fetch(`/api/products/${params.id}`)
      const result = await response.json()
      if (result.data) {
        const product = result.data
        setStatus(product.status)
        setBasicFieldValues(product.basic_info || {})
        setAttributeValues(product.attribute_values || {})
        setImages(product.image_urls || [])
        setColorAliases(product.colorAliases || {})
        setBarcodeRule(product.barcodeRule || null)

        // 设置完整的颜色选择信息
        if (product.selectedColorDetails && product.selectedColorDetails.length > 0) {
          setSelectedColorDetails(product.selectedColorDetails)
          setSelectedColors(product.selectedColorDetails.map((c: SelectedColor) => c.colorValueId))
        }

        // 设置选中的尺码ID列表
        if (product.selectedSizeIds && product.selectedSizeIds.length > 0) {
          setSelectedSizeIds(product.selectedSizeIds)
          setSelectedSizes(product.selectedSizeIds)
        }

        // 存储商品的颜色和尺码信息（用于SKU组合和尺码显示）
        if (product.colors && product.colors.length > 0) {
          setProductColors(product.colors)
        }
        if (product.sizes && product.sizes.length > 0) {
          setProductSizes(product.sizes)
        }
      }
    } catch (error) {
      console.error('获取商品详情失败:', error)
      toast({
        variant: 'destructive',
        title: '加载失败',
        description: '无法加载商品信息',
      })
    } finally {
      setFetching(false)
    }
  }

  // 获取基本信息字段
  const fetchBasicFields = async () => {
    try {
      const response = await fetch('/api/products/basic-fields')
      const result = await response.json()
      if (result.data) {
        // 按分组sort_order和字段sort_order排序
        const enabledFields = result.data
          .filter((field: any) => field.enabled !== false)
          .sort((a: any, b: any) => {
            // 先按分组的 sort_order 排序
            const aGroupSortOrder = a.field_group?.sort_order ?? 999999
            const bGroupSortOrder = b.field_group?.sort_order ?? 999999
            if (aGroupSortOrder !== bGroupSortOrder) {
              return aGroupSortOrder - bGroupSortOrder
            }
            // 同一分组内按 sort_order 排序
            return (a.sort_order || 0) - (b.sort_order || 0)
          })
        setBasicFields(enabledFields)
      }
    } catch (error) {
      console.error('获取基本信息字段失败:', error)
    }
  }

  // 获取属性配置
  const fetchAttributes = async () => {
    try {
      const response = await fetch('/api/products/attributes')
      const result = await response.json()
      if (result.data) {
        // 只返回启用的属性，按排序字段排序
        const enabledAttributes = result.data
          .filter((attr: any) => attr.enabled !== false)
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
        setAttributes(enabledAttributes)
      }
    } catch (error) {
      console.error('获取属性配置失败:', error)
    }
  }

  // 获取颜色组
  const fetchColors = async () => {
    try {
      const response = await fetch('/api/products/color-groups')
      const result = await response.json()
      if (result.data) {
        setColorGroups(result.data)
      }
    } catch (error) {
      console.error('获取颜色组失败:', error)
    }
  }

  // 获取尺码组
  const fetchSizes = async () => {
    try {
      const response = await fetch('/api/products/size-groups')
      const result = await response.json()
      if (result.data) {
        setSizeGroups(result.data)
      }
    } catch (error) {
      console.error('获取尺码组失败:', error)
    }
  }

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const result = await response.json()
      if (result.data) {
        setSuppliers(result.data)
      }
    } catch (error) {
      console.error('获取供应商列表失败:', error)
    }
  }

  // 添加SKU条码
  const handleAddBarcode = (skuKey: string) => {
    setSkuBarcodes(prev => ({
      ...prev,
      [skuKey]: [...(prev[skuKey] || []), '']
    }))
  }

  // 更新SKU条码
  const handleUpdateBarcode = (skuKey: string, barcodeIndex: number, value: string) => {
    setSkuBarcodes(prev => ({
      ...prev,
      [skuKey]: prev[skuKey]?.map((barcode, idx) =>
        idx === barcodeIndex ? value : barcode
      ) || []
    }))
  }

  // 删除SKU条码
  const handleRemoveBarcode = (skuKey: string, barcodeIndex: number) => {
    setSkuBarcodes(prev => ({
      ...prev,
      [skuKey]: prev[skuKey]?.filter((_, idx) => idx !== barcodeIndex) || []
    }))
  }

  // 上传图片
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })
        const result = await response.json()
        return result.data.url
      })

      const urls = await Promise.all(uploadPromises)
      setImages([...images, ...urls])
      toast({
        title: '上传成功',
        description: `成功上传 ${urls.length} 张图片`,
      })
    } catch (error) {
      console.error('图片上传失败:', error)
      toast({
        variant: 'destructive',
        title: '上传失败',
        description: '请重试',
      })
    } finally {
      setUploading(false)
    }
  }

  // 删除图片
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // 验证单个字段值
  const validateField = (field: any, value: any): string | null => {
    // 必填字段验证
    if (field.required) {
      // 空值检查：null、undefined、空字符串都是空值，但 0 不是
      if (value === null || value === undefined || value === '') {
        return '此字段为必填项'
      }
    }

    // 数字字段验证
    if (field.value_type === 'number' && value !== null && value !== undefined && value !== '') {
      const numValue = Number(value)
      if (isNaN(numValue)) {
        return '请输入有效的数字'
      }
    }

    // 选择框字段验证
    if (field.value_type === 'select' && value !== null && value !== undefined && value !== '') {
      // 检查值是否在选项列表中
      const options = field.options ? field.options.split(',') : []
      if (options.length > 0 && !options.includes(value)) {
        return '请选择有效的选项'
      }
    }

    // 日期字段验证
    if (field.value_type === 'date' && value !== null && value !== undefined && value !== '') {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        return '请输入有效的日期'
      }
    }

    return null
  }

  // 计算 SKU 组合列表
  const skuCombinations = useMemo(() => {
    if (selectedColorDetails.length === 0 || selectedSizeIds.length === 0) {
      return []
    }

    // 获取货号
    const productCode = basicFieldValues['product_code'] || ''

    // 从 sizeGroups 中获取尺码详细信息（包含所有可选尺码）
    const sizeDetails: any[] = []
    sizeGroups.forEach(group => {
      group.size_values?.forEach((size: any) => {
        if (selectedSizeIds.includes(size.id)) {
          sizeDetails.push({
            id: size.id,
            name: size.name,
            code: size.code,
            groupName: group.name || '-',
            groupCode: group.code || '',
          })
        }
      })
    })

    // 生成颜色×尺码的所有组合
    const combinations: any[] = []
    let index = 1

    selectedColorDetails.forEach(color => {
      sizeDetails.forEach(size => {
        // 计算款色：货号 + 色系编码 + 颜色编码
        const styleColor = productCode ? `${productCode}${color.groupCode || ''}${color.colorCode || ''}` : '-'

        // 使用条码规则生成条码
        const barcode = generateBarcode(
          productCode,
          color.colorCode || '',
          color.groupCode || '',
          size.code || '',
          size.groupCode || ''
        )

        // SKU唯一标识：颜色ID-尺码ID
        const skuKey = `${color.colorValueId}-${size.id}`

        combinations.push({
          index: index++,
          productCode: productCode || '-',
          styleColor,
          groupName: color.groupName || '-',
          groupCode: color.groupCode || '-',
          colorName: color.colorName || '-',
          colorCode: color.colorCode || '-',
          colorAlias: color.colorAlias || '-',
          sizeName: size.name,
          sizeCode: size.code,
          barcode,
          skuKey,
          colorValueId: color.colorValueId,
          sizeId: size.id,
        })
      })
    })

    return combinations
  }, [selectedColorDetails, selectedSizeIds, sizeGroups, basicFieldValues, barcodeRule])

  // 验证所有字段
  const validateForm = (): boolean => {
    let isValid = true
    const errors: Record<string, string> = {}

    basicFields.forEach((field: any) => {
      if (field.required) {
        const value = basicFieldValues[field.field_code]
        const error = validateField(field, value)
        if (error) {
          errors[field.field_code] = error
          isValid = false
        }
      }
    })

    setFieldErrors(errors)
    return isValid
  }

  // 处理字段值变化
  const handleFieldChange = (field: any, value: any) => {
    setBasicFieldValues(prev => ({ ...prev, [field.field_code]: value }))

    // 清除该字段的错误
    if (fieldErrors[field.field_code]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field.field_code]
        return newErrors
      })
    }
  }

  // 处理字段失去焦点
  const handleFieldBlur = (field: any) => {
    const value = basicFieldValues[field.field_code]
    const error = validateField(field, value)
    if (error) {
      setFieldErrors(prev => ({ ...prev, [field.field_code]: error }))
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field.field_code]
        return newErrors
      })
    }
  }

  // 更新商品
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证表单
    const isValid = validateForm()
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: '表单验证失败',
        description: '请检查标红的必填字段',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicInfo: basicFieldValues,
          attributeValues,
          imageUrls: images,
          status,
          colors: selectedColorDetails, // 发送颜色信息（包含图片）
        }),
      })

      const result = await response.json()
      if (response.ok) {
        toast({
          title: '更新成功',
          description: '商品信息已更新',
        })
        router.push('/products')
      } else {
        throw new Error(result.error || '更新失败')
      }
    } catch (error) {
      console.error('更新商品失败:', error)
      toast({
        variant: 'destructive',
        title: '更新失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setLoading(false)
    }
  }

  // 渲染基本信息字段
  const renderBasicField = (field: any) => {
    const isAutoGenerate = field.auto_generate === true && field.code_rule_id;
    const hasError = !!fieldErrors[field.field_code]
    const errorMessage = fieldErrors[field.field_code]

    switch (field.field_type) {
      case 'text':
        return (
          <div className="space-y-2">
            <div className="relative">
              <Input
                value={(basicFieldValues[field.field_code] ?? '')}
                readOnly={isAutoGenerate}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                onBlur={() => handleFieldBlur(field)}
                placeholder={field.field_name}
                className={isAutoGenerate ? "bg-gray-50 cursor-not-allowed pr-8" : hasError ? "border-red-500" : ""}
              />
              {isAutoGenerate && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
              )}
            </div>
            {hasError && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        )
      case 'textarea':
        return (
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                value={(basicFieldValues[field.field_code] ?? '')}
                readOnly={isAutoGenerate}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                onBlur={() => handleFieldBlur(field)}
                placeholder={field.field_name}
                className={`min-h-[80px] ${isAutoGenerate ? "bg-gray-50 cursor-not-allowed" : ""} ${hasError ? "border-red-500" : ""}`}
              />
              {isAutoGenerate && (
                <div className="absolute right-2 top-2 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
              )}
            </div>
            {hasError && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        )
      case 'number':
        return (
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="number"
                value={basicFieldValues[field.field_code] ?? ''}
                readOnly={isAutoGenerate}
                onChange={(e) => {
                  if (isAutoGenerate) return;
                  const value = e.target.value;
                  // 如果用户清空输入框，传递空字符串；否则转换为数字
                  handleFieldChange(field, value === '' ? '' : parseFloat(value))
                }}
                onBlur={() => handleFieldBlur(field)}
                placeholder={field.field_name}
                className={isAutoGenerate ? "bg-gray-50 cursor-not-allowed pr-8" : hasError ? "border-red-500" : ""}
              />
              {isAutoGenerate && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
              )}
            </div>
            {hasError && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        )
      case 'select':
        // 特殊处理供应商字段：尝试从多个字段名获取值
        let selectValue = basicFieldValues[field.field_code] ?? ''
        if ((selectValue === '' || selectValue === null || selectValue === undefined) && 
            (field.field_code === 'supplier' || field.field_code === 'supplier_id')) {
          selectValue = basicFieldValues.supplier_id || basicFieldValues.supplier || ''
        }
        
        return (
          <div className="space-y-2">
            <div className="relative">
              <Select
                value={String(selectValue)}
                disabled={isAutoGenerate}
                onValueChange={(value) => handleFieldChange(field, value)}
              >
                <SelectTrigger className={`w-full ${isAutoGenerate ? "bg-gray-50 cursor-not-allowed pr-8" : ""} ${hasError ? "border-red-500" : ""}`}>
                  <SelectValue placeholder={`选择${field.field_name}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAutoGenerate && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Lock className="h-4 w-4" />
                </div>
              )}
            </div>
            {hasError && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        )
      case 'date':
        return (
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="date"
                value={(basicFieldValues[field.field_code] ?? '')}
                readOnly={isAutoGenerate}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                onBlur={() => handleFieldBlur(field)}
                className={isAutoGenerate ? "bg-gray-50 cursor-not-allowed pr-8" : hasError ? "border-red-500" : ""}
              />
              {isAutoGenerate && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
              )}
            </div>
            {hasError && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        )
      case 'boolean':
        return (
          <Checkbox
            checked={basicFieldValues[field.field_code] || false}
            onCheckedChange={(checked) => handleFieldChange(field, checked)}
          />
        )
      default:
        return null
    }
  }

  // 根据布局参数渲染字段
  const renderFieldsByLayout = () => {
    // 按 row_index 分组，然后在每组内按 sort_order 排序
    const fieldsByRow = basicFields.reduce((acc: Record<number, any[]>, field) => {
      const rowIndex = field.row_index || 1
      if (!acc[rowIndex]) {
        acc[rowIndex] = []
      }
      acc[rowIndex].push(field)
      return acc
    }, {})

    // 对每一行的字段按 sort_order 排序
    Object.keys(fieldsByRow).forEach(rowIndex => {
      const numericRowIndex = parseInt(rowIndex, 10)
      if (fieldsByRow[numericRowIndex]) {
        fieldsByRow[numericRowIndex].sort((a: any, b: any) => a.sort_order - b.sort_order)
      }
    })

    return (
      <div className="space-y-4">
        {Object.entries(fieldsByRow).map(([rowIndexStr, fields]) => {
          const rowIndex = parseInt(rowIndexStr, 10)
          // 计算当前行的 grid 配置
          // columns 表示总列数，column_width 表示单个字段的宽度
          // 我们使用 Tailwind 的 grid 系统，总列数固定为 12
          const rowFields = fields as any[]
          
          // 检查是否所有字段都有 new_row 标志，如果有则单独一行
          const fieldsWithNewRow = rowFields.filter((f) => f.new_row)
          const normalFields = rowFields.filter((f) => !f.new_row)

          return (
            <div key={rowIndex}>
              {/* 渲染正常字段 */}
              {normalFields.length > 0 && (
                <div 
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${normalFields[0]?.columns || 12}, minmax(0, 1fr))`,
                  }}
                >
                  {normalFields.map((field) => {
                    const colSpan = field.column_width || 1
                    return (
                      <div 
                        key={field.id}
                        style={{ 
                          gridColumn: `span ${colSpan}`
                        }}
                      >
                        <Label htmlFor={`field-${field.id}`}>
                          {field.field_name}
                          {field.is_required && ' *'}
                          {field.auto_generate && (
                            <span className="ml-2 text-xs text-gray-500">(自动生成，编辑时不变)</span>
                          )}
                        </Label>
                        {renderBasicField(field)}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 渲染需要单独一行的字段 */}
              {fieldsWithNewRow.map((field) => (
                <div key={`newrow-${field.id}`} className="mt-4">
                  <Label htmlFor={`field-${field.id}`}>
                    {field.field_name}
                    {field.is_required && ' *'}
                    {field.auto_generate && (
                      <span className="ml-2 text-xs text-gray-500">(自动生成，编辑时不变)</span>
                    )}
                  </Label>
                  {renderBasicField(field)}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">编辑商品</h1>
        <p className="text-gray-600 text-sm">修改商品信息并保存</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="attributes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="attributes">商品属性</TabsTrigger>
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="variants">颜色尺码</TabsTrigger>
            <TabsTrigger value="images">商品图片</TabsTrigger>
          </TabsList>

          {/* 基本信息 Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>商品基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 根据布局参数动态渲染基本信息字段 */}
                {renderFieldsByLayout()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 商品属性 Tab */}
          <TabsContent value="attributes">
            <Card>
              <CardHeader>
                <CardTitle>商品属性</CardTitle>
              </CardHeader>
              <CardContent>
                {attributes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无属性配置</p>
                ) : (
                  (() => {
                    // 按 row_index 分组，然后在每组内按 sort_order 排序
                    const attrsByRow = attributes.reduce((acc: Record<number, any[]>, attr) => {
                      const rowIndex = attr.row_index || 1
                      if (!acc[rowIndex]) {
                        acc[rowIndex] = []
                      }
                      acc[rowIndex].push(attr)
                      return acc
                    }, {})

                    // 对每一行的属性按 sort_order 排序
                    Object.keys(attrsByRow).forEach(rowIndex => {
                      const numericRowIndex = parseInt(rowIndex, 10)
                      if (attrsByRow[numericRowIndex]) {
                        attrsByRow[numericRowIndex].sort((a: any, b: any) => a.sort_order - b.sort_order)
                      }
                    })

                    return (
                      <div className="space-y-4">
                        {Object.entries(attrsByRow).map(([rowIndexStr, attrs]) => {
                          const rowAttrs = attrs as any[]
                          
                          // 检查是否所有属性都有 new_row 标志
                          const attrsWithNewRow = rowAttrs.filter((a) => a.new_row)
                          const normalAttrs = rowAttrs.filter((a) => !a.new_row)

                          return (
                            <div key={rowIndexStr}>
                              {/* 渲染正常排列的属性 */}
                              {normalAttrs.length > 0 && (
                                <div 
                                  className="grid gap-2"
                                  style={{
                                    gridTemplateColumns: `repeat(${normalAttrs[0]?.columns || 5}, minmax(0, 1fr))`,
                                  }}
                                >
                                  {normalAttrs.map((attr) => {
                                    const colSpan = attr.column_width || 1
                                    return (
                                      <div 
                                        key={attr.id}
                                        style={{ 
                                          gridColumn: `span ${colSpan}`
                                        }}
                                      >
                                        <Label>{attr.name}</Label>
                                        <Select
                                          value={attributeValues[attr.code] || ''}
                                          onValueChange={(value) => setAttributeValues({
                                            ...attributeValues,
                                            [attr.code]: value,
                                          })}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder={`选择${attr.name}`} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {attr.product_attribute_values?.map((val: any) => (
                                              <SelectItem key={val.id} value={val.code}>
                                                {val.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* 渲染需要单独一行的属性 */}
                              {attrsWithNewRow.map((attr) => (
                                <div key={`newrow-${attr.id}`} className="mt-4">
                                  <Label>{attr.name}</Label>
                                  <Select
                                    value={attributeValues[attr.code] || ''}
                                    onValueChange={(value) => setAttributeValues({
                                      ...attributeValues,
                                      [attr.code]: value,
                                    })}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder={`选择${attr.name}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {attr.product_attribute_values?.map((val: any) => (
                                        <SelectItem key={val.id} value={val.code}>
                                          {val.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 颜色尺码 Tab */}
          <TabsContent value="variants">
            <div className="space-y-6">
              {/* 颜色选择 */}
              <ColorSelector
                colorGroups={colorGroups}
                suppliers={suppliers}
                value={selectedColorDetails}
                productCode={basicFieldValues['product_code'] || ''}
                defaultSupplierId={basicFieldValues['supplier_id'] || basicFieldValues['supplier'] ? parseInt(basicFieldValues['supplier_id'] || basicFieldValues['supplier']) : undefined}
                defaultFactoryCode={basicFieldValues['factory_code'] || ''}
                onChange={setSelectedColorDetails}
              />

              {/* 尺码选择 */}
              <Card>
                <CardHeader>
                  <CardTitle>选择尺码</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sizeGroups.map((group) => {
                      // 获取当前尺码组的所有尺码ID
                      const groupSizeIds = group.size_values?.map((size: any) => size.id) || []
                      // 检查是否全选
                      const isAllSelected = groupSizeIds.length > 0 && groupSizeIds.every((id: number) => selectedSizeIds.includes(id))
                      // 检查是否部分选中
                      const isPartialSelected = groupSizeIds.some((id: number) => selectedSizeIds.includes(id)) && !isAllSelected

                      return (
                        <div key={group.id}>
                          <div className="flex items-center justify-between mb-2">
                            <Label>{group.name}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (isAllSelected) {
                                  // 取消全选：移除当前组的所有尺码
                                  setSelectedSizeIds(selectedSizeIds.filter(id => !groupSizeIds.includes(id)))
                                } else {
                                  // 全选：添加当前组的所有尺码
                                  setSelectedSizeIds([...new Set([...selectedSizeIds, ...groupSizeIds])])
                                }
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              {isAllSelected ? '取消全选' : '全选'}
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.size_values?.map((size: any) => (
                              <button
                                key={size.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSizeIds(
                                    selectedSizeIds.includes(size.id)
                                      ? selectedSizeIds.filter((id) => id !== size.id)
                                      : [...selectedSizeIds, size.id]
                                  )
                                }}
                                className={`px-2.5 py-1 rounded-md border transition-colors text-xs ${
                                  selectedSizeIds.includes(size.id)
                                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {size.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* SKU 组合预览 */}
              {skuCombinations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>SKU 组合预览</CardTitle>
                    <CardDescription>
                      共 {skuCombinations.length} 个 SKU 组合
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">序号</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">货号</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">款色</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">色系</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">色系编码</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">颜色</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">颜色编码</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">颜色别名</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">尺码</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">尺码编码</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">条码</th>
                            <th className="text-left py-1.5 px-2 text-xs font-medium text-gray-700">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {skuCombinations.map((sku) => {
                            const additionalBarcodes = skuBarcodes[sku.skuKey] || []
                            
                            return (
                              <tr key={sku.index} className="border-b hover:bg-gray-50">
                                <td className="py-1.5 px-2 text-xs">{sku.index}</td>
                                <td className="py-1.5 px-2 text-xs">{sku.productCode}</td>
                                <td className="py-1.5 px-2 text-xs font-medium">{sku.styleColor}</td>
                                <td className="py-1.5 px-2 text-xs">{sku.groupName}</td>
                                <td className="py-1.5 px-2 text-xs">{sku.groupCode}</td>
                                <td className="py-1.5 px-2 text-xs">{sku.colorName}</td>
                                <td className="py-1.5 px-2 text-xs">{sku.colorCode}</td>
                                <td className="py-1.5 px-2 text-xs">{sku.colorAlias}</td>
                                <td className="py-1.5 px-2 text-xs">{sku.sizeName}</td>
                                <td className="py-1.5 px-2 text-xs">{sku.sizeCode || '-'}</td>
                                <td className="py-1.5 px-2 text-xs">
                                  <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{sku.barcode}</span>
                                </td>
                                <td className="py-1.5 px-2 text-xs">
                                  <div className="flex items-center gap-0.5">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setCurrentSkuKey(sku.skuKey)
                                        setNewBarcodeValue('')
                                        setBarcodeDialogMode('add')
                                        setBarcodeDialogOpen(true)
                                      }}
                                      className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                      title="添加条码"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setCurrentSkuKey(sku.skuKey)
                                        setCurrentMainBarcode(sku.barcode)
                                        setBarcodeDialogMode('view')
                                        setBarcodeDialogOpen(true)
                                      }}
                                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                      title="查看条码"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* 商品图片 Tab */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>商品图片</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <label className={`cursor-pointer ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <Button variant="outline" asChild>
                        <span className="flex items-center gap-2">
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          本地上传
                        </span>
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      onClick={() => setImageSelectorOpen(true)}
                      disabled={uploading}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      从图片空间选择
                    </Button>
                  </div>

                  {/* 图片预览 */}
                  {images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`商品图片 ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">暂无商品图片</p>
                      <p className="text-xs text-gray-400 mt-1">点击上方按钮上传或从图片空间选择</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存更改
          </Button>
        </div>
      </form>

      {/* 条码弹窗 */}
      <Dialog open={barcodeDialogOpen} onOpenChange={setBarcodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {barcodeDialogMode === 'view' && '查看条码'}
              {barcodeDialogMode === 'add' && '添加条码'}
              {barcodeDialogMode === 'edit' && '编辑条码'}
            </DialogTitle>
          </DialogHeader>
          
          {barcodeDialogMode === 'view' && (
            <div className="space-y-3">
              {/* 主条码 */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <span className="font-mono text-sm">{currentMainBarcode}</span>
                <Badge variant="secondary" className="text-xs">主条码</Badge>
                <Badge variant="outline" className="text-xs text-gray-500">系统生成</Badge>
              </div>
              {/* 附加条码 */}
              {(skuBarcodes[currentSkuKey] || []).map((barcode, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white border rounded-md">
                  <span className="font-mono text-sm">{barcode}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingBarcodeIndex(idx)
                        setNewBarcodeValue(barcode)
                        setBarcodeDialogMode('edit')
                      }}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      title="编辑"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleRemoveBarcode(currentSkuKey, idx)
                      }}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      title="删除"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!skuBarcodes[currentSkuKey] || skuBarcodes[currentSkuKey].length === 0) && (
                <p className="text-center text-gray-500 text-sm py-4">暂无附加条码</p>
              )}
            </div>
          )}
          
          {barcodeDialogMode === 'add' && (
            <div className="space-y-4">
              <div>
                <Label>新条码</Label>
                <Input
                  value={newBarcodeValue}
                  onChange={(e) => setNewBarcodeValue(e.target.value)}
                  placeholder="请输入条码"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBarcodeDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => {
                  if (!newBarcodeValue.trim()) {
                    toast({ title: '提示', description: '请输入条码', variant: 'destructive' })
                    return
                  }
                  setSkuBarcodes(prev => ({
                    ...prev,
                    [currentSkuKey]: [...(prev[currentSkuKey] || []), newBarcodeValue.trim()]
                  }))
                  setBarcodeDialogOpen(false)
                  toast({ title: '成功', description: '条码添加成功' })
                }}>
                  确认
                </Button>
              </div>
            </div>
          )}
          
          {barcodeDialogMode === 'edit' && (
            <div className="space-y-4">
              <div>
                <Label>编辑条码</Label>
                <Input
                  value={newBarcodeValue}
                  onChange={(e) => setNewBarcodeValue(e.target.value)}
                  placeholder="请输入条码"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">附加条码可以编辑和删除，主条码为系统自动生成不可修改</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBarcodeDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => {
                  if (!newBarcodeValue.trim()) {
                    toast({ title: '提示', description: '请输入条码', variant: 'destructive' })
                    return
                  }
                  handleUpdateBarcode(currentSkuKey, editingBarcodeIndex, newBarcodeValue.trim())
                  setBarcodeDialogOpen(false)
                  toast({ title: '成功', description: '条码更新成功' })
                }}>
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 图片选择器 */}
      <ImageSelector
        open={imageSelectorOpen}
        onOpenChange={setImageSelectorOpen}
        multiple={true}
        onSelect={(selectedImages) => {
          const newUrls = selectedImages.map(img => img.url)
          setImages([...images, ...newUrls])
          if (selectedImages.length > 0) {
            toast({
              title: '添加成功',
              description: `已添加 ${selectedImages.length} 张图片`,
            })
          }
        }}
      />
    </div>
  )
}
