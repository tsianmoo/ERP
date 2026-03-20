'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Eye } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ColorSelector, SelectedColor } from '@/components/products/color-selector'

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

export default function ViewProductPage() {
  const router = useRouter()
  const params = useParams()
  const [fetching, setFetching] = useState(true)
  
  // 基本信息字段
  const [basicFields, setBasicFields] = useState<any[]>([])
  const [basicFieldValues, setBasicFieldValues] = useState<Record<string, any>>({})
  
  // 属性配置
  const [attributes, setAttributes] = useState<any[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({})
  
  // 颜色和尺码（从商品SKU获取的实际颜色尺码）
  const [productColors, setProductColors] = useState<any[]>([])
  const [productSizes, setProductSizes] = useState<any[]>([])
  
  // 完整的颜色选择信息（ColorSelector 使用）
  const [selectedColorDetails, setSelectedColorDetails] = useState<SelectedColor[]>([])
  // 选中的尺码ID列表
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([])
  
  // 颜色和尺码组（用于获取组信息）
  const [colorGroups, setColorGroups] = useState<any[]>([])
  const [sizeGroups, setSizeGroups] = useState<any[]>([])
  
  // 颜色别名映射
  const [colorAliases, setColorAliases] = useState<Record<number, string>>({})
  
  // 条码规则
  const [barcodeRule, setBarcodeRule] = useState<BarcodeRule | null>(null)
  
  // 图片
  const [images, setImages] = useState<string[]>([])
  
  // 商品状态
  const [status, setStatus] = useState('active')
  
  // 条码弹窗
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false)
  const [currentBarcode, setCurrentBarcode] = useState('')
  const [currentSkuInfo, setCurrentSkuInfo] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchProduct()
      fetchBasicFields()
      fetchAttributes()
      fetchColors()
      fetchSizes()
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
        // Java后端返回的是 colors_data，需要从中提取 selectedColorDetails
        if (product.colors_data && product.colors_data.length > 0) {
          setSelectedColorDetails(product.colors_data)
        }

        // 设置选中的尺码ID列表
        // Java后端返回的是 sizes_data，直接作为ID列表使用
        if (product.sizes_data && product.sizes_data.length > 0) {
          setSelectedSizeIds(product.sizes_data)
        }

        // 存储商品的颜色和尺码信息（用于SKU组合）
        // Java后端返回的是 colors_data 和 sizes_data
        if (product.colors_data && product.colors_data.length > 0) {
          setProductColors(product.colors_data)
        }
        if (product.sizes_data && product.sizes_data.length > 0) {
          setProductSizes(product.sizes_data)
        }
      }
    } catch (error) {
      console.error('获取商品详情失败:', error)
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

  // 计算 SKU 组合列表
  const skuCombinations = useMemo(() => {
    if (selectedColorDetails.length === 0 || selectedSizeIds.length === 0) {
      return []
    }

    // 获取货号
    const productCode = basicFieldValues['product_code'] || ''

    // 颜色详细信息（使用 selectedColorDetails）
    const colorDetails = selectedColorDetails.map(color => ({
      id: color.colorValueId,
      name: color.colorName,
      code: color.colorCode,
      groupName: color.groupName,
      groupCode: color.groupCode,
      colorAlias: color.colorAlias,
      image: color.image,
    }))

    // 尺码详细信息（直接使用 API 返回的尺码数据）
    const sizeDetails = productSizes
      .filter(size => selectedSizeIds.includes(size.id))
      .map(size => ({
        id: size.id,
        name: size.name,
        code: size.code,
        groupName: size.size_groups?.name || '-',
        groupCode: size.size_groups?.code || '',
      }))

    // 生成颜色×尺码的所有组合
    const combinations: any[] = []
    let index = 1

    colorDetails.forEach(color => {
      sizeDetails.forEach(size => {
        // 计算款色：货号 + 色系编码 + 颜色编码
        const styleColor = productCode ? `${productCode}${color.groupCode || ''}${color.code || ''}` : '-'

        // 使用条码规则生成条码
        const barcode = generateBarcode(
          productCode,
          color.code || '',
          color.groupCode || '',
          size.code || '',
          size.groupCode || ''
        )

        combinations.push({
          index: index++,
          productCode: productCode || '-',
          styleColor,
          groupName: color.groupName || '-',
          groupCode: color.groupCode || '-',
          colorName: color.name || '-',
          colorCode: color.code || '-',
          colorAlias: color.colorAlias || '-',
          image: color.image,
          sizeName: size.name,
          sizeCode: size.code,
          barcode,
        })
      })
    })

    return combinations
  }, [selectedColorDetails, selectedSizeIds, productSizes, basicFieldValues, barcodeRule])

  // 渲染基本信息字段（只读）
  const renderBasicField = (field: any) => {
    const value = basicFieldValues[field.field_code]

    switch (field.field_type) {
      case 'text':
        return (
          <Input
            value={value ?? ''}
            readOnly
            disabled
            className="bg-gray-50"
          />
        )
      case 'textarea':
        return (
          <Textarea
            value={value ?? ''}
            readOnly
            disabled
            className="bg-gray-50 min-h-[80px]"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={value ?? ''}
            readOnly
            disabled
            className="bg-gray-50"
          />
        )
      case 'select':
        return (
          <Select value={value ?? ''} disabled>
            <SelectTrigger className="w-full bg-gray-50">
              <SelectValue placeholder={`选择${field.display_name || field.field_name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt: any) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'date':
        return (
          <Input
            type="date"
            value={value ?? ''}
            readOnly
            disabled
            className="bg-gray-50"
          />
        )
      case 'boolean':
        return (
          <div className="flex items-center">
            <Checkbox checked={value || false} disabled />
            <span className="ml-2 text-sm text-gray-600">
              {value ? '是' : '否'}
            </span>
          </div>
        )
      default:
        return <span>{value ?? '-'}</span>
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
                        <Label>{field.display_name || field.field_name}</Label>
                        {renderBasicField(field)}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 渲染需要单独一行的字段 */}
              {fieldsWithNewRow.map((field) => (
                <div key={`newrow-${field.id}`} className="mt-4">
                  <Label>{field.display_name || field.field_name}</Label>
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
      <div className="space-y-4">
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
                  className="grid gap-2"
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
                        <Label>{attr.name}</Label>
                        <Select value={attributeValues[attr.code] || ''} disabled>
                          <SelectTrigger className="w-full bg-gray-50">
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
              {attributesWithNewRow.map((attr) => (
                <div key={`newrow-${attr.id}`} className="mt-4">
                  <Label>{attr.name}</Label>
                  <Select value={attributeValues[attr.code] || ''} disabled>
                    <SelectTrigger className="w-full bg-gray-50">
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
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
        <h1 className="text-2xl font-semibold text-gray-900">查看商品</h1>
        <p className="text-gray-600 text-sm">商品详情信息</p>
      </div>

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
              {renderAttributesByLayout()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 颜色尺码 Tab */}
        <TabsContent value="variants">
          <div className="space-y-6">
            {/* 颜色选择 */}
            <ColorSelector
              colorGroups={colorGroups}
              value={selectedColorDetails}
              productCode={basicFieldValues['product_code'] || ''}
              readOnly={true}
            />

            {/* 尺码选择 */}
            <Card>
              <CardHeader>
                <CardTitle>选择的尺码</CardTitle>
                <CardDescription>共 {selectedSizeIds.length} 种尺码</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSizeIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {productSizes
                      .filter((size: any) => selectedSizeIds.includes(size.id))
                      .map((size: any) => (
                        <div
                          key={size.id}
                          className="px-2.5 py-1 rounded-md border border-blue-400 bg-blue-50 text-blue-700 text-xs"
                        >
                          {size.name}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">暂无尺码信息</div>
                )}
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
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">序号</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">货号</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">款色</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">色系</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">色系编码</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">颜色</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">颜色编码</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">颜色别名</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">尺码</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">条码</th>
                        </tr>
                      </thead>
                      <tbody>
                        {skuCombinations.map((sku) => (
                          <tr key={sku.index} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 text-sm">{sku.index}</td>
                            <td className="py-2 px-3 text-sm">{sku.productCode}</td>
                            <td className="py-2 px-3 text-sm font-medium">{sku.styleColor}</td>
                            <td className="py-2 px-3 text-sm">{sku.groupName}</td>
                            <td className="py-2 px-3 text-sm">{sku.groupCode}</td>
                            <td className="py-2 px-3 text-sm">{sku.colorName}</td>
                            <td className="py-2 px-3 text-sm">{sku.colorCode}</td>
                            <td className="py-2 px-3 text-sm">{sku.colorAlias}</td>
                            <td className="py-2 px-3 text-sm">{sku.sizeName}</td>
                            <td className="py-2 px-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{sku.barcode}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentBarcode(sku.barcode)
                                    setCurrentSkuInfo(`${sku.colorName} / ${sku.sizeName}`)
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
                        ))}
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
              {images.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`商品图片 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  暂无图片
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 条码查看弹窗 */}
      <Dialog open={barcodeDialogOpen} onOpenChange={setBarcodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>条码详情</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-500">SKU: {currentSkuInfo}</div>
            {/* 主条码 */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
              <span className="font-mono text-sm">{currentBarcode}</span>
              <Badge variant="secondary" className="text-xs">主条码</Badge>
              <Badge variant="outline" className="text-xs text-gray-500">系统生成</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
