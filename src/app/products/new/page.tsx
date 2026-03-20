'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Plus, Loader2, Info, Eye, Edit2, ImagePlus, Save } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
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
import { ColorSelector } from '@/components/products/color-selector'
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

export default function AddProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // 草稿相关
  const [draftId, setDraftId] = useState<number | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // 基本信息字段
  const [basicFields, setBasicFields] = useState<any[]>([])
  const [basicFieldValues, setBasicFieldValues] = useState<Record<string, any>>({})
  // 字段的自动生成开关状态
  const [fieldAutoGenerate, setFieldAutoGenerate] = useState<Record<string, boolean>>({})
  // 字段验证错误
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // 属性配置
  const [attributes, setAttributes] = useState<any[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({})
  
  // 颜色和尺码
  const [colorGroups, setColorGroups] = useState<any[]>([])
  const [sizeGroups, setSizeGroups] = useState<any[]>([])
  const [selectedColorDetails, setSelectedColorDetails] = useState<any[]>([])
  const [selectedSizes, setSelectedSizes] = useState<number[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  
  // 条码规则
  const [barcodeRule, setBarcodeRule] = useState<BarcodeRule | null>(null)

  // SKU多条码管理 - key为 `${colorId}-${sizeId}`，value为条码数组
  const [skuBarcodes, setSkuBarcodes] = useState<Record<string, string[]>>({})

  // 条码弹窗状态
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false)
  const [barcodeDialogMode, setBarcodeDialogMode] = useState<'view' | 'add' | 'edit'>('view')
  const [currentSkuKey, setCurrentSkuKey] = useState<string>('')
  const [currentMainBarcode, setCurrentMainBarcode] = useState<string>('')
  const [editingBarcodeIndex, setEditingBarcodeIndex] = useState<number>(-1)
  const [newBarcodeValue, setNewBarcodeValue] = useState<string>('')

  // 图片
  const [images, setImages] = useState<string[]>([])
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false)

  // 使用 ref 保存最新的值，避免 setTimeout 闭包问题
  const basicFieldsRef = useRef<any[]>(basicFields)
  const basicFieldValuesRef = useRef<Record<string, any>>(basicFieldValues)
  const attributeValuesRef = useRef<Record<string, string>>(attributeValues)

  // 更新 ref
  useEffect(() => {
    basicFieldsRef.current = basicFields
  }, [basicFields])

  useEffect(() => {
    basicFieldValuesRef.current = basicFieldValues
  }, [basicFieldValues])

  useEffect(() => {
    attributeValuesRef.current = attributeValues
  }, [attributeValues])

  useEffect(() => {
    fetchBasicFields()
    fetchAttributes()
    fetchColors()
    fetchSizes()
    fetchSuppliers()
  }, [])

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

  // 获取基本信息字段
  const fetchBasicFields = async () => {
    try {
      const response = await fetch('/api/products/basic-fields')
      const result = await response.json()
      if (result.data) {
        // 只返回启用的字段，按分组sort_order和字段sort_order排序
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
        
        // 获取货号字段关联的编码规则（用于条码生成）
        const productCodeField = enabledFields.find((f: any) => f.db_field_name === 'product_code')
        if (productCodeField?.code_rule_id) {
          fetchBarcodeRule(productCodeField.code_rule_id)
        }
      }
    } catch (error) {
      console.error('获取基本信息字段失败:', error)
    }
  }

  // 获取条码规则
  const fetchBarcodeRule = async (codeRuleId: number) => {
    try {
      const response = await fetch(`/api/products/code-rules/${codeRuleId}`)
      const result = await response.json()
      if (result.data && result.data.barcode_enabled) {
        setBarcodeRule({
          id: result.data.id,
          ruleName: result.data.rule_name,
          barcodeElements: result.data.barcode_elements || [],
        })
      }
    } catch (error) {
      console.error('获取条码规则失败:', error)
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

  // 保存草稿
  const saveDraft = useCallback(async (showToast = false) => {
    // 检查是否有任何数据
    const hasData = 
      Object.keys(basicFieldValues).length > 0 ||
      Object.keys(attributeValues).length > 0 ||
      selectedColorDetails.length > 0 ||
      selectedSizes.length > 0 ||
      images.length > 0

    if (!hasData) {
      return null
    }

    setIsSavingDraft(true)
    try {
      const response = await fetch('/api/products/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          basicInfo: basicFieldValues,
          attributeValues,
          colors: selectedColorDetails,
          sizes: selectedSizes,
          imageUrls: images,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        if (result.data?.id && !draftId) {
          setDraftId(result.data.id)
        }
        setHasUnsavedChanges(false)
        if (showToast) {
          toast({
            title: '草稿已保存',
            description: '商品信息已保存为待启用状态',
          })
        }
        return result.data
      }
    } catch (error) {
      console.error('保存草稿失败:', error)
      if (showToast) {
        toast({
          variant: 'destructive',
          title: '保存失败',
          description: '草稿保存失败，请重试',
        })
      }
    } finally {
      setIsSavingDraft(false)
    }
    return null
  }, [draftId, basicFieldValues, attributeValues, selectedColorDetails, selectedSizes, images, toast])

  // 监听数据变化，标记未保存
  useEffect(() => {
    const hasData = 
      Object.keys(basicFieldValues).length > 0 ||
      Object.keys(attributeValues).length > 0 ||
      selectedColorDetails.length > 0 ||
      selectedSizes.length > 0 ||
      images.length > 0

    if (hasData) {
      setHasUnsavedChanges(true)
    }
  }, [basicFieldValues, attributeValues, selectedColorDetails, selectedSizes, images])

  // 返回时保存草稿
  const handleGoBack = async () => {
    if (hasUnsavedChanges) {
      await saveDraft(true)
    }
    router.push('/products')
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

  // 自动生成可以生成的字段（当条件满足时）
  useEffect(() => {
    if (!basicFields.length) return

    // 找出所有自动生成字段
    const autoGenerateFields = basicFields.filter(
      (field: any) => field.auto_generate === true && field.code_rule_id
    )
    
    if (autoGenerateFields.length === 0) return

    // 使用 setTimeout 避免快速连续触发
    const timer = setTimeout(async () => {
      // 使用 ref 获取最新的值
      const currentBasicFieldValues = basicFieldValuesRef.current
      const currentAttributeValues = attributeValuesRef.current

      for (const field of autoGenerateFields) {
        // 如果字段已经有值，跳过（避免覆盖用户手动输入）
        if (currentBasicFieldValues && currentBasicFieldValues[field.field_code]) {
          continue
        }

        // 获取编码规则
        try {
          const ruleResponse = await fetch(`/api/products/code-rules/${field.code_rule_id}`)
          if (!ruleResponse.ok) continue

          const ruleData = await ruleResponse.json()
          const elements: any[] = ruleData.data?.elements || []

          // 检查编码规则需要的变量是否都已填写
          let allVariablesReady = true
          
          for (const element of elements) {
            if (!element.enabled) continue

            if (element.type === 'variable') {
              const variable = element.value

              // 特殊变量：year, month, day, sequence 不需要用户输入
              if (['year', 'month', 'day', 'sequence'].includes(variable)) {
                continue
              }

              // 检查用户是否已填写该变量
              const hasValue =
                (currentBasicFieldValues && currentBasicFieldValues[variable]) ||
                (currentAttributeValues && currentAttributeValues[variable])

              if (!hasValue) {
                allVariablesReady = false
                break
              }
            }
          }

          // 如果所有必需的变量都已填写，则自动生成该字段
          if (allVariablesReady) {
            const response = await fetch('/api/products/generate-field-value', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                field_code: field.field_code,
                code_rule_id: field.code_rule_id,
                basic_field_values: currentBasicFieldValues,
                attribute_values: currentAttributeValues,
              }),
            })

            const result = await response.json()
            if (result.success && result.data?.value) {
              setBasicFieldValues(prev => ({
                ...prev,
                [field.field_code]: result.data.value,
              }))
            }
          }
        } catch (error) {
          console.error('获取编码规则失败:', error)
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [basicFields, basicFieldValues, attributeValues])

  // 计算 SKU 组合列表
  const skuCombinations = useMemo(() => {
    if (selectedColorDetails.length === 0 || selectedSizes.length === 0) {
      return []
    }

    // 获取货号
    const productCode = basicFieldValues['product_code'] || ''

    // 获取尺码详细信息
    const sizeDetails: any[] = []
    selectedSizes.forEach(sizeId => {
      sizeGroups.forEach(group => {
        const size = group.size_values?.find((s: any) => s.id === sizeId)
        if (size) {
          sizeDetails.push({
            id: size.id,
            name: size.name,
            code: size.code,
            groupName: group.name,
            groupCode: group.code, // 添加尺码组编码
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
        const mainBarcode = generateBarcode(
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
          barcode: mainBarcode,
          skuKey,
          colorValueId: color.colorValueId,
          sizeId: size.id,
        })
      })
    })

    return combinations
  }, [selectedColorDetails, selectedSizes, basicFieldValues, sizeGroups, barcodeRule, basicFieldValues, attributeValues])

  // 批量生成所有自动生成字段的值
  const generateAllAutoFields = async () => {
    const autoGenerateFields = basicFields.filter(
      (field: any) => field.auto_generate === true && field.code_rule_id
    )

    if (autoGenerateFields.length === 0) {
      toast({
        variant: 'destructive',
        title: '没有可生成的字段',
        description: '当前没有配置自动生成字段',
      })
      return
    }

    // 启用所有字段的自动生成开关
    const newFieldAutoGenerate: Record<string, boolean> = {}
    autoGenerateFields.forEach((field: any) => {
      newFieldAutoGenerate[field.field_code] = true
    })
    setFieldAutoGenerate({
      ...fieldAutoGenerate,
      ...newFieldAutoGenerate,
    })

    // 逐个生成字段值
    const promises = autoGenerateFields.map((field: any) =>
      fetch('/api/products/generate-field-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_code: field.field_code,
          code_rule_id: field.code_rule_id,
          basic_field_values: basicFieldValues,
          attribute_values: attributeValues,
        }),
      })
    )

    try {
      const results = await Promise.all(promises)
      const newValues: Record<string, any> = { ...basicFieldValues }

      // 等待所有响应解析完成
      const parsedResults = await Promise.all(results.map(r => r.json()))
      parsedResults.forEach((result, index) => {
        if (result.success) {
          newValues[autoGenerateFields[index].db_field_name] = result.data.value
        }
      })

      setBasicFieldValues(newValues)
      toast({
        title: '批量生成成功',
        description: `已生成 ${parsedResults.filter(r => r.success).length}/${autoGenerateFields.length} 个字段`,
      })
    } catch (error) {
      console.error('批量生成失败:', error)
      toast({
        variant: 'destructive',
        title: '批量生成失败',
        description: '请检查配置是否完整',
      })
    }
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

  // 添加SKU条码
  const handleAddBarcode = (skuKey: string) => {
    setSkuBarcodes(prev => ({
      ...prev,
      [skuKey]: [...(prev[skuKey] || []), ''] // 添加空条码，等待用户输入
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

  // 保存商品
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

    // 检查颜色和尺码
    if (selectedColorDetails.length === 0) {
      toast({
        variant: 'destructive',
        title: '表单验证失败',
        description: '请至少选择一个颜色',
      })
      return
    }

    if (selectedSizes.length === 0) {
      toast({
        variant: 'destructive',
        title: '表单验证失败',
        description: '请至少选择一个尺码',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicInfo: basicFieldValues,
          attributeValues,
          imageUrls: images,
          colors: selectedColorDetails,
          sizes: selectedSizes,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        setHasUnsavedChanges(false) // 清除未保存标记
        toast({
          title: '添加成功',
          description: '商品已成功添加',
        })
        router.push('/products')
      } else {
        throw new Error(result.error || '添加失败')
      }
    } catch (error) {
      console.error('添加商品失败:', error)
      toast({
        variant: 'destructive',
        title: '添加失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setLoading(false)
    }
  }

  // 渲染基本信息字段
  const renderBasicField = (field: any) => {
    // 使用更安全的类型检查
    const isAutoGenerateEnabled = Boolean(field.auto_generate) && Boolean(field.code_rule_id)
    const autoGenerateState = fieldAutoGenerate[field.field_code] ?? isAutoGenerateEnabled
    const hasError = !!fieldErrors[field.field_code]
    const errorMessage = fieldErrors[field.field_code]

    // 自动生成字段的生成函数
    const generateFieldValue = async (fieldCode: string, codeRuleId: number) => {
      try {
        // 获取最新的值
        const response = await fetch('/api/products/generate-field-value', {
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
            [field.field_code]: result.data.value,
          }))
          toast({
            title: '生成成功',
            description: `${field.display_name || field.field_name}：${result.data.value}`,
          })
        }
      } catch (error) {
        console.error(`生成${field.display_name || field.field_name}失败:`, error)
        toast({
          variant: 'destructive',
          title: '生成失败',
          description: `请检查配置是否完整`,
        })
      }
    }

    switch (field.field_type) {
      case 'text':
        // 如果字段启用了自动生成
        if (isAutoGenerateEnabled) {
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {/* 开关 */}
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={autoGenerateState}
                    onCheckedChange={(checked) => {
                      setFieldAutoGenerate({
                        ...fieldAutoGenerate,
                        [field.field_code]: checked,
                      })
                      // 如果开启自动生成，立即生成一次
                      if (checked && field.code_rule_id) {
                        generateFieldValue(field.field_code, field.code_rule_id)
                      }
                    }}
                    className="scale-75"
                  />
                  <span className="text-xs text-gray-500">
                    {autoGenerateState ? '自动' : '手动'}
                  </span>
                </div>

                {/* 提示信息 */}
                <div className="flex items-center gap-1 text-xs text-blue-500">
                  <Info className="h-3 w-3" />
                  <span>{autoGenerateState ? '根据编码规则生成' : '手动输入'}</span>
                </div>
              </div>

              {/* 输入框 */}
              {autoGenerateState ? (
                <Input
                  value={(basicFieldValues[field.field_code] ?? '')}
                  readOnly
                  className="h-7 text-xs bg-gray-50 cursor-not-allowed"
                  placeholder="自动生成中..."
                />
              ) : (
                <Input
                  value={(basicFieldValues[field.field_code] ?? '')}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  onBlur={() => handleFieldBlur(field)}
                  placeholder={field.display_name || field.field_name}
                  className={`h-7 text-xs ${hasError ? 'border-red-500' : ''}`}
                />
              )}
              {hasError && <p className="text-xs text-red-500">{errorMessage}</p>}
            </div>
          )
        }

        // 普通文本字段
        return (
          <div className="space-y-1">
            <Input
              value={(basicFieldValues[field.field_code] ?? '')}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.field_name}
              className={`h-7 text-xs ${hasError ? 'border-red-500' : ''}`}
            />
            {hasError && <p className="text-xs text-red-500">{errorMessage}</p>}
          </div>
        )
      case 'textarea':
        return (
          <div className="space-y-1">
            <Textarea
              value={(basicFieldValues[field.field_code] ?? '')}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.field_name}
              className={`min-h-[60px] text-xs ${hasError ? 'border-red-500' : ''}`}
            />
            {hasError && <p className="text-xs text-red-500">{errorMessage}</p>}
          </div>
        )
      case 'number':
        return (
          <div className="space-y-1">
            <Input
              type="number"
              value={basicFieldValues[field.field_code] ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                // 如果用户清空输入框，传递空字符串；否则转换为数字
                handleFieldChange(field, value === '' ? '' : parseFloat(value))
              }}
              onBlur={() => handleFieldBlur(field)}
              placeholder={field.field_name}
              className={`h-7 text-xs ${hasError ? 'border-red-500' : ''}`}
            />
            {hasError && <p className="text-xs text-red-500">{errorMessage}</p>}
          </div>
        )
      case 'select': {
        // 如果是供应商字段，使用 suppliers 列表作为选项
        const isSupplierField = field.field_code === 'supplier_id' || field.field_code === 'supplier'
        
        // 解析 options，可能是字符串或数组
        let fieldOptions: any[] = []
        if (field.options) {
          if (typeof field.options === 'string') {
            try {
              fieldOptions = JSON.parse(field.options)
            } catch {
              fieldOptions = []
            }
          } else if (Array.isArray(field.options)) {
            fieldOptions = field.options
          }
        }
        
        const selectOptions = isSupplierField 
          ? suppliers.map((s: any) => ({ value: s.id.toString(), label: `${s.supplier_name || s.name} (${s.supplier_code || s.code})` }))
          : fieldOptions
        
        return (
          <div className="space-y-1">
            <Select
              value={(basicFieldValues[field.field_code] ?? '').toString()}
              onValueChange={(value) => handleFieldChange(field, value)}
            >
              <SelectTrigger className={`w-full h-7 text-xs py-1 ${hasError ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={`选择${field.display_name || field.field_name}`} />
              </SelectTrigger>
              <SelectContent>
                {selectOptions.map((opt: any) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-xs text-red-500">{errorMessage}</p>}
          </div>
        )
      }
      case 'date':
        return (
          <div className="space-y-1">
            <Input
              type="date"
              value={(basicFieldValues[field.field_code] ?? '')}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              className={`h-7 text-xs ${hasError ? 'border-red-500' : ''}`}
            />
            {hasError && <p className="text-xs text-red-500">{errorMessage}</p>}
          </div>
        )
      case 'boolean':
        return (
          <Checkbox
            checked={basicFieldValues[field.field_code] || false}
            onCheckedChange={(checked) => handleFieldChange(field, checked)}
            className="scale-90"
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
      <div className="space-y-2">
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
                  className="grid gap-x-4 gap-y-2"
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
                        <Label htmlFor={`field-${field.id}`} className="text-xs text-gray-600 mb-1 block">
                          {field.display_name || field.field_name}
                          {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
                        </Label>
                        {renderBasicField(field)}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 渲染需要单独一行的字段 */}
              {fieldsWithNewRow.map((field) => (
                <div key={`newrow-${field.id}`}>
                  <Label htmlFor={`field-${field.id}`} className="text-xs text-gray-600 mb-1 block">
                    {field.display_name || field.field_name}
                    {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
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

  // 根据布局参数渲染商品属性
  const renderAttributesByLayout = () => {
    // 按 row_index 分组，然后在每组内按 sort_order 排序
    const attributesByRow = attributes.reduce((acc: Record<number, any[]>, attr) => {
      const rowIndex = attr.row_index || 1
      if (!acc[rowIndex]) {
        acc[rowIndex] = []
      }
      acc[rowIndex].push(attr)
      return acc
    }, {})

    // 对每一行的属性按 sort_order 排序
    Object.keys(attributesByRow).forEach(rowIndex => {
      const numericRowIndex = parseInt(rowIndex, 10)
      if (attributesByRow[numericRowIndex]) {
        attributesByRow[numericRowIndex].sort((a: any, b: any) => a.sort_order - b.sort_order)
      }
    })

    return (
      <div className="space-y-2">
        {Object.entries(attributesByRow).map(([rowIndexStr, attrs]) => {
          const rowIndex = parseInt(rowIndexStr, 10)
          const rowAttributes = attrs as any[]
          
          // 检查是否所有属性都有 new_row 标志，如果有则单独一行
          const attributesWithNewRow = rowAttributes.filter((a) => a.new_row)
          const normalAttributes = rowAttributes.filter((a) => !a.new_row)

          return (
            <div key={rowIndex}>
              {/* 渲染正常属性 */}
              {normalAttributes.length > 0 && (
                <div 
                  className="grid gap-x-4 gap-y-2"
                  style={{
                    gridTemplateColumns: `repeat(${normalAttributes[0]?.columns || 12}, minmax(0, 1fr))`,
                  }}
                >
                  {normalAttributes.map((attr) => {
                    const colSpan = attr.column_width || 1
                    return (
                      <div 
                        key={attr.id}
                        style={{ 
                          gridColumn: `span ${colSpan}`
                        }}
                      >
                        <Label htmlFor={attr.code} className="text-xs text-gray-600 mb-1 block">
                          {attr.name}
                          {attr.is_required && <span className="text-red-500 ml-0.5">*</span>}
                        </Label>
                        <Select
                          value={attributeValues[attr.code] || ''}
                          onValueChange={(value) => setAttributeValues({
                            ...attributeValues,
                            [attr.code]: value,
                          })}
                        >
                          <SelectTrigger className="w-full h-7 text-xs py-1">
                            <SelectValue placeholder={`选择${attr.name}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {attr.product_attribute_values?.map((val: any) => (
                              <SelectItem key={val.id} value={val.code} className="text-xs">
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
              {attributesWithNewRow.map((attr) => (
                <div key={`newrow-${attr.id}`}>
                  <Label htmlFor={attr.code} className="text-xs text-gray-600 mb-1 block">
                    {attr.name}
                    {attr.is_required && <span className="text-red-500 ml-0.5">*</span>}
                  </Label>
                  <Select
                    value={attributeValues[attr.code] || ''}
                    onValueChange={(value) => setAttributeValues({
                      ...attributeValues,
                      [attr.code]: value,
                    })}
                  >
                    <SelectTrigger className="w-full h-7 text-xs py-1">
                      <SelectValue placeholder={`选择${attr.name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {attr.product_attribute_values?.map((val: any) => (
                        <SelectItem key={val.id} value={val.code} className="text-xs">
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
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <Button
            variant="outline"
            onClick={() => saveDraft(true)}
            disabled={isSavingDraft || !hasUnsavedChanges}
            className="text-gray-600"
          >
            {isSavingDraft ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存草稿
          </Button>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">添加商品</h1>
        <p className="text-gray-600 text-sm">填写商品信息并保存</p>
        {draftId && (
          <p className="text-xs text-gray-400 mt-1">草稿 ID: {draftId}</p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="attributes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="attributes">商品属性</TabsTrigger>
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="variants">颜色尺码</TabsTrigger>
            <TabsTrigger value="images">商品图片</TabsTrigger>
          </TabsList>

          {/* 商品属性 Tab */}
          <TabsContent value="attributes">
            <Card className="border border-gray-200">
              <CardHeader className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-sm font-medium text-gray-900">商品属性</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {renderAttributesByLayout()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 基本信息 Tab */}
          <TabsContent value="basic">
            <Card className="border border-gray-200">
              <CardHeader className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-sm font-medium text-gray-900">商品基本信息</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {/* 批量生成按钮 */}
                {basicFields.some((field: any) => field.auto_generate === true && field.code_rule_id) && (
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50/80 border border-blue-100 rounded-md">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateAllAutoFields}
                      className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-100"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      批量生成自动字段
                    </Button>
                    <span className="text-xs text-gray-500">
                      一键生成所有配置为自动生成的字段值
                    </span>
                  </div>
                )}

                {/* 根据布局参数动态渲染基本信息字段 */}
                {renderFieldsByLayout()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 颜色尺码 Tab */}
          <TabsContent value="variants">
            <div className="space-y-6">
              {/* 颜色选择 */}
              <Card className="border border-gray-200">
                <CardHeader className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <CardTitle className="text-sm font-medium text-gray-900">5.颜色选择</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ColorSelector
                    colorGroups={colorGroups}
                    suppliers={suppliers}
                    productCode={basicFieldValues['product_code'] || ''}
                    defaultSupplierId={basicFieldValues['supplier_id'] || basicFieldValues['supplier'] ? parseInt(basicFieldValues['supplier_id'] || basicFieldValues['supplier']) : undefined}
                    defaultFactoryCode={basicFieldValues['factory_code'] || ''}
                    onChange={setSelectedColorDetails}
                  />
                </CardContent>
              </Card>

              {/* 尺码选择 */}
              <Card className="border border-gray-200">
                <CardHeader className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <CardTitle className="text-sm font-medium text-gray-900">选择尺码</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sizeGroups.map((group) => {
                      // 获取当前尺码组的所有尺码ID
                      const groupSizeIds = group.size_values?.map((size: any) => size.id) || []
                      // 检查是否全选
                      const isAllSelected = groupSizeIds.length > 0 && groupSizeIds.every((id: number) => selectedSizes.includes(id))
                      // 检查是否部分选中
                      const isPartialSelected = groupSizeIds.some((id: number) => selectedSizes.includes(id)) && !isAllSelected

                      return (
                        <div key={group.id}>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs">{group.name}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (isAllSelected) {
                                  // 取消全选：移除当前组的所有尺码
                                  setSelectedSizes(selectedSizes.filter(id => !groupSizeIds.includes(id)))
                                } else {
                                  // 全选：添加当前组的所有尺码
                                  setSelectedSizes([...new Set([...selectedSizes, ...groupSizeIds])])
                                }
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              {isAllSelected ? '取消全选' : '全选'}
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {group.size_values?.map((size: any) => (
                              <button
                                key={size.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSizes(
                                    selectedSizes.includes(size.id)
                                      ? selectedSizes.filter((id) => id !== size.id)
                                      : [...selectedSizes, size.id]
                                  )
                                }}
                                className={`px-2 py-1 rounded border transition-colors text-xs ${
                                  selectedSizes.includes(size.id)
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
                <Card className="border border-gray-200">
                  <CardHeader className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-900">SKU 组合预览</CardTitle>
                      <span className="text-xs text-gray-500">共 {skuCombinations.length} 个组合</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
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
                            const allBarcodes = [sku.barcode, ...additionalBarcodes]
                            
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
            <Card className="border border-gray-200">
              <CardHeader className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-sm font-medium text-gray-900">商品图片</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <label className={`cursor-pointer ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                        <span className="flex items-center gap-1.5">
                          {uploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          本地上传
                        </span>
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImageSelectorOpen(true)}
                      disabled={uploading}
                      className="h-7 text-xs"
                    >
                      <ImagePlus className="h-3 w-3 mr-1.5" />
                      从图片空间选择
                    </Button>
                  </div>

                  {/* 图片预览 */}
                  {images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`商品图片 ${index + 1}`}
                            className="w-full h-28 object-cover rounded border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-md p-8 text-center bg-gray-50/50">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">暂无商品图片</p>
                      <p className="text-xs text-gray-400 mt-1">点击上方按钮上传或从图片空间选择</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-7 text-xs"
          >
            取消
          </Button>
          <Button type="submit" size="sm" disabled={loading} className="h-7 text-xs">
            {loading && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
            保存商品
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
