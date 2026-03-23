'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, Search, Upload, Trash2, Loader2, ImagePlus } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { ColorPicker } from '@/components/ui/color-picker'
import { useToast } from '@/hooks/use-toast'
import { ImageSelector } from '@/components/images/image-selector'

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
  color: string
  color_values?: ColorValue[]
}

export interface SelectedColor {
  id: number
  colorValueId: number
  groupId: number
  groupName: string
  groupCode: string
  colorName: string
  colorCode: string
  colorAlias: string
  hexCode: string
  factoryColorCode: string
  styleCode: string
  supplierId?: number
  supplierName?: string
  image?: string
}

interface Supplier {
  id: number
  name: string
  code: string
  supplier_name?: string
  supplier_code?: string
}

interface ColorSelectorProps {
  colorGroups?: ColorGroup[]
  suppliers?: Supplier[]
  onChange?: (selectedColors: SelectedColor[]) => void
  value?: SelectedColor[]  // 初始值
  readOnly?: boolean       // 只读模式
  productCode?: string     // 货号，用于计算款色
  defaultSupplierId?: number    // 默认供应商ID（从基本信息获取）
  defaultFactoryCode?: string   // 默认原厂货号（从基本信息获取）
}

export function ColorSelector({ 
  colorGroups = [], 
  suppliers = [], 
  onChange, 
  value, 
  readOnly = false, 
  productCode = '',
  defaultSupplierId,
  defaultFactoryCode = ''
}: ColorSelectorProps) {
  const { toast } = useToast()
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null)
  const [selectedColors, setSelectedColors] = useState<SelectedColor[]>([])

  // 当 value 变化时更新 selectedColors
  // 使用 useRef 来跟踪是否是外部值的更新
  const prevValueRef = useRef<SelectedColor[] | undefined>(undefined)
  
  useEffect(() => {
    // 只有当 value 发生变化且不为空时才更新
    if (value && value.length > 0) {
      // 检查 value 是否与之前不同（比较所有字段，包括 groupName 和 groupCode）
      const prevJson = prevValueRef.current ? JSON.stringify(prevValueRef.current) : ''
      const currJson = JSON.stringify(value)
      const isDifferent = prevJson !== currJson
      
      if (isDifferent) {
        setSelectedColors(value)
      }
    }
    prevValueRef.current = value
  }, [value])

  // 当前选中的颜色信息
  const [colorAlias, setColorAlias] = useState('')
  const [factoryColorCode, setFactoryColorCode] = useState('')
  const [supplierId, setSupplierId] = useState<number | undefined>()
  const [styleCode, setStyleCode] = useState('')
  
  // 标记是否已手动设置过供应商
  const hasManuallySetSupplier = useRef(false)

  // 图片上传相关
  const [uploadingColorId, setUploadingColorId] = useState<number | null>(null)
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false)
  const [currentEditingColorId, setCurrentEditingColorId] = useState<number | null>(null)
  const [currentImageForColor, setCurrentImageForColor] = useState<string>('')

  // 搜索
  const [groupSearch, setGroupSearch] = useState('')
  const [colorSearch, setColorSearch] = useState('')

  // 新增色系相关
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false)
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    code: '',
    codeLength: 2,
    color: '#3B82F6',
  })

  // 新增颜色相关
  const [isAddColorDialogOpen, setIsAddColorDialogOpen] = useState(false)
  const [addingColor, setAddingColor] = useState(false)
  const [newColorData, setNewColorData] = useState({
    name: '',
    code: '',
  })

  // 获取选中的色系
  const selectedGroup = colorGroups.find(g => g.id === selectedGroupId)
  const selectedColor = selectedGroup?.color_values?.find(c => c.id === selectedColorId)

  // 过滤色系
  const filteredGroups = colorGroups.filter(group =>
    group.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    group.code.toLowerCase().includes(groupSearch.toLowerCase())
  )

  // 过滤颜色
  const filteredColors = selectedGroup?.color_values?.filter(color =>
    color.name.toLowerCase().includes(colorSearch.toLowerCase()) ||
    color.code.toLowerCase().includes(colorSearch.toLowerCase())
  ) || []

  // 监听默认值的变化（从基本信息获取）
  // 当基本信息中的供应商变化时，自动同步到颜色选择器（如果用户没有手动更改过）
  useEffect(() => {
    // 只有当 defaultSupplierId 是有效的正整数时才更新
    const validSupplierId = defaultSupplierId ? Number(defaultSupplierId) : null
    if (validSupplierId && validSupplierId > 0 && !hasManuallySetSupplier.current) {
      setSupplierId(validSupplierId)
    }
  }, [defaultSupplierId])

  useEffect(() => {
    if (defaultFactoryCode) {
      setFactoryColorCode(defaultFactoryCode)
    }
  }, [defaultFactoryCode])
  
  // 当用户手动更改供应商时，设置标记
  const handleSupplierChange = (value: string) => {
    hasManuallySetSupplier.current = true
    setSupplierId(parseInt(value))
  }

  // 选择色系
  const handleSelectGroup = (groupId: number) => {
    setSelectedGroupId(groupId)
    setSelectedColorId(null)
    setColorAlias('')
    // 设置默认值
    setFactoryColorCode(defaultFactoryCode)
    setSupplierId(defaultSupplierId)
    setColorSearch('')
  }

  // 选择颜色
  const handleSelectColor = (colorId: number) => {
    setSelectedColorId(colorId)
    // 选择颜色后，如果表单中没有值，则填充默认值
    if (!factoryColorCode && defaultFactoryCode) {
      setFactoryColorCode(defaultFactoryCode)
    }
    if (!supplierId && defaultSupplierId) {
      setSupplierId(defaultSupplierId)
    }
  }

  // 添加颜色到列表
  const handleAddSelectedColor = () => {
    if (!selectedColor || !selectedGroup) return

    // 使用表单值或默认值
    const finalSupplierId = supplierId ?? defaultSupplierId
    const finalFactoryCode = factoryColorCode || defaultFactoryCode

    const newColor: SelectedColor = {
      id: Date.now(),
      colorValueId: selectedColor.id,
      groupId: selectedGroup.id,
      groupName: selectedGroup.name,
      groupCode: selectedGroup.code,
      colorName: selectedColor.name,
      colorCode: selectedColor.code,
      colorAlias: colorAlias || selectedColor.name,
      hexCode: selectedColor.hex_code || '',
      factoryColorCode: finalFactoryCode,
      styleCode,
      supplierId: finalSupplierId,
      supplierName: suppliers.find(s => s.id === finalSupplierId)?.name || suppliers.find(s => s.id === finalSupplierId)?.supplier_name,
    }

    setSelectedColors([...selectedColors, newColor])
    onChange?.([...selectedColors, newColor])

    // 清空当前选择，但保留默认值用于下一个颜色
    setSelectedColorId(null)
    setColorAlias('')
    setFactoryColorCode(defaultFactoryCode)  // 重置为默认值
    setSupplierId(defaultSupplierId)          // 重置为默认值
    setStyleCode('')
  }

  // 添加颜色并上传图片
  const handleAddColorWithImage = () => {
    if (!selectedColor || !selectedGroup) return

    // 使用表单值或默认值
    const finalSupplierId = supplierId ?? defaultSupplierId
    const finalFactoryCode = factoryColorCode || defaultFactoryCode

    const newColorId = Date.now()
    const newColor: SelectedColor = {
      id: newColorId,
      colorValueId: selectedColor.id,
      groupId: selectedGroup.id,
      groupName: selectedGroup.name,
      groupCode: selectedGroup.code,
      colorName: selectedColor.name,
      colorCode: selectedColor.code,
      colorAlias: colorAlias || selectedColor.name,
      hexCode: selectedColor.hex_code || '',
      factoryColorCode: finalFactoryCode,
      styleCode,
      supplierId: finalSupplierId,
      supplierName: suppliers.find(s => s.id === finalSupplierId)?.name || suppliers.find(s => s.id === finalSupplierId)?.supplier_name,
    }

    setSelectedColors([...selectedColors, newColor])
    onChange?.([...selectedColors, newColor])

    // 清空当前选择
    setSelectedColorId(null)
    setColorAlias('')
    setFactoryColorCode(defaultFactoryCode)
    setSupplierId(defaultSupplierId)
    setStyleCode('')

    // 打开图片选择器
    setCurrentEditingColorId(newColorId)
    setCurrentImageForColor('')
    setImageSelectorOpen(true)
  }

  // 从列表中删除颜色
  const handleRemoveColor = (id: number) => {
    const newColors = selectedColors.filter(c => c.id !== id)
    setSelectedColors(newColors)
    onChange?.(newColors)
  }

  // 清空当前选择
  const handleClearCurrent = () => {
    setSelectedColorId(null)
    setColorAlias('')
    setFactoryColorCode(defaultFactoryCode)
    setSupplierId(defaultSupplierId)
    setStyleCode('')
    setColorSearch('')
  }

  // 上传颜色图片 - 本地上传
  const handleColorImageUpload = async (colorId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 获取当前颜色信息，用于生成文件名
    const color = selectedColors.find(c => c.id === colorId)
    
    setUploadingColorId(colorId)
    try {
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)
      
      // 生成文件名：货号+色系编码+颜色编码
      if (productCode && color) {
        const customFileName = `${productCode}${color.groupCode || ''}${color.colorCode || ''}`
        formData.append('fileName', customFileName)
        formData.append('overwrite', 'true') // 同名文件覆盖
      }

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (result.success && result.data?.url) {
        // 更新颜色的图片
        const newColors = selectedColors.map(c => 
          c.id === colorId ? { ...c, image: result.data.url } : c
        )
        setSelectedColors(newColors)
        onChange?.(newColors)
        toast({
          title: '上传成功',
          description: '图片已上传',
        })
      } else {
        throw new Error(result.error || '上传失败')
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      toast({
        variant: 'destructive',
        title: '上传失败',
        description: '请重试',
      })
    } finally {
      setUploadingColorId(null)
    }
  }

  // 打开图片空间选择
  const openImageSelector = (colorId: number) => {
    const color = selectedColors.find(c => c.id === colorId)
    setCurrentEditingColorId(colorId)
    setCurrentImageForColor(color?.image || '')
    setImageSelectorOpen(true)
  }

  // 从图片空间选择图片后处理
  const handleImageSelect = (images: { id: number; name: string; url: string }[]) => {
    if (images.length > 0 && currentEditingColorId) {
      const newColors = selectedColors.map(c => 
        c.id === currentEditingColorId ? { ...c, image: images[0].url } : c
      )
      setSelectedColors(newColors)
      onChange?.(newColors)
      toast({
        title: '添加成功',
        description: '图片已设置',
      })
    }
    setImageSelectorOpen(false)
    setCurrentEditingColorId(null)
  }

  // 删除颜色图片
  const handleRemoveColorImage = (colorId: number) => {
    const newColors = selectedColors.map(c => 
      c.id === colorId ? { ...c, image: undefined } : c
    )
    setSelectedColors(newColors)
    onChange?.(newColors)
    toast({
      title: '删除成功',
      description: '图片已删除',
    })
  }

  // 新增色系
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingGroup(true)
    try {
      const response = await fetch('/api/products/color-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroupData),
      })

      if (response.ok) {
        const result = await response.json()
        setIsAddGroupDialogOpen(false)
        setNewGroupData({ name: '', code: '', codeLength: 2, color: '#3B82F6' })
        toast({
          title: '添加成功',
          description: `已添加色系"${newGroupData.name}"`,
        })
        // 触发父组件刷新数据
        window.location.reload()
      } else {
        const error = await response.json()
        throw new Error(error.error || '添加失败')
      }
    } catch (error) {
      console.error('添加色系失败:', error)
      toast({
        variant: 'destructive',
        title: '添加失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setAddingGroup(false)
    }
  }

  // 新增颜色
  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroupId) return

    setAddingColor(true)
    try {
      const response = await fetch('/api/products/color-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroupId,
          name: newColorData.name,
          code: newColorData.code,
          sortOrder: (selectedGroup?.color_values?.length || 0) + 1,
        }),
      })

      if (response.ok) {
        setIsAddColorDialogOpen(false)
        setNewColorData({ name: '', code: '' })
        toast({
          title: '添加成功',
          description: `已添加颜色"${newColorData.name}"`,
        })
        // 触发父组件刷新数据
        window.location.reload()
      } else {
        const error = await response.json()
        throw new Error(error.error || '添加失败')
      }
    } catch (error) {
      console.error('添加颜色失败:', error)
      toast({
        variant: 'destructive',
        title: '添加失败',
        description: error instanceof Error ? error.message : '请重试',
      })
    } finally {
      setAddingColor(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 只读模式只显示已选颜色列表 */}
      {readOnly ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">已选颜色</CardTitle>
            <CardDescription>共 {selectedColors.length} 种颜色</CardDescription>
          </CardHeader>
          <CardContent>
          {selectedColors.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-xs text-gray-600 font-medium">
                    <th className="px-4 py-3 text-left">序号</th>
                    <th className="px-4 py-3 text-left">色系</th>
                    <th className="px-4 py-3 text-left">颜色</th>
                    <th className="px-4 py-3 text-left">色系编码</th>
                    <th className="px-4 py-3 text-left">颜色编码</th>
                    <th className="px-4 py-3 text-left">颜色别名</th>
                    <th className="px-4 py-3 text-left">款色</th>
                    <th className="px-4 py-3 text-left">原厂款色货号</th>
                    <th className="px-4 py-3 text-left">供应商名称</th>
                    <th className="px-4 py-3 text-left">商品图片</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedColors.map((color, index) => {
                    // 计算款色 = 货号 + 色系编码 + 颜色编码
                    const styleColor = productCode && color.groupCode && color.colorCode 
                      ? `${productCode}${color.groupCode}${color.colorCode}` 
                      : productCode || '-'
                    
                    return (
                      <tr
                        key={color.id}
                        className={`text-sm ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        } border-t border-gray-100`}
                      >
                        <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900">{color.groupName || '-'}</td>
                        <td className="px-4 py-3 text-gray-900">{color.colorName}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{color.groupCode || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{color.colorCode}</td>
                        <td className="px-4 py-3 text-gray-900">{color.colorAlias || color.colorName}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{styleColor}</td>
                        <td className="px-4 py-3 text-gray-600">{color.factoryColorCode || '-'}</td>
                        <td className="px-4 py-3 text-gray-900">{color.supplierName || '-'}</td>
                        <td className="px-4 py-3">
                          {color.image ? (
                            <div className="relative w-10 h-10">
                              <img
                                src={color.image}
                                alt={color.colorName}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">暂无图片</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无颜色信息
            </div>
          )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 1. 选择色系 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">1. 选择色系</Label>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索色系..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddGroupDialogOpen(true)}
                  className="h-9 px-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增色系
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleSelectGroup(group.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all text-xs ${
                    selectedGroupId === group.id
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: group.color || '#3B82F6',
                      boxShadow: `0 1px 4px ${(group.color || '#3B82F6')}40`,
                    }}
                  />
                  {group.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 选择颜色 */}
          {selectedGroupId && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">2. 选择颜色</Label>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索颜色..."
                      value={colorSearch}
                      onChange={(e) => setColorSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddColorDialogOpen(true)}
                    className="h-9 px-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新增颜色
                  </Button>
                </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredColors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => handleSelectColor(color.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all text-xs ${
                  selectedColorId === color.id
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {color.hex_code && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-200"
                    style={{ backgroundColor: color.hex_code }}
                  />
                )}
                {color.name}({color.code})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 颜色详细信息 */}
      {selectedColor && selectedGroup && (
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* 3. 颜色别名 */}
            <div>
              <Label htmlFor="colorAlias" className="text-sm font-semibold text-gray-700">
                3. 颜色别名
              </Label>
              <Input
                id="colorAlias"
                value={colorAlias}
                onChange={(e) => setColorAlias(e.target.value)}
                placeholder="可留空，默认使用颜色名称"
                className="mt-2 h-10"
              />
            </div>

            {/* 4. 原厂款色货号 */}
            <div>
              <Label htmlFor="factoryColorCode" className="text-sm font-semibold text-gray-700">
                4. 原厂款色货号
              </Label>
              <Input
                id="factoryColorCode"
                value={factoryColorCode}
                onChange={(e) => setFactoryColorCode(e.target.value)}
                placeholder="请输入原厂款色货号"
                className="mt-2 h-10"
              />
            </div>

            {/* 5. 款色 */}
            <div>
              <Label htmlFor="styleCode" className="text-sm font-semibold text-gray-700">
                5. 款色
              </Label>
              <Input
                id="styleCode"
                value={styleCode}
                onChange={(e) => setStyleCode(e.target.value)}
                className="mt-2 h-10 bg-gray-100"
                readOnly
              />
            </div>

            {/* 6. 选择供应商 */}
            <div>
              <Label htmlFor="supplier" className="text-sm font-semibold text-gray-700">
                6. 选择供应商
              </Label>
              <Select 
                value={supplierId?.toString() || ''} 
                onValueChange={handleSupplierChange}
              >
                <SelectTrigger className="mt-2 h-10 w-full">
                  <SelectValue placeholder={defaultSupplierId ? "使用基本信息中的供应商" : "请选择该颜色的供应商"} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name || supplier.supplier_name} ({supplier.code || supplier.supplier_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleAddSelectedColor}
                className="bg-gray-900 hover:bg-gray-800 text-white h-10 px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加颜色
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddColorWithImage}
                className="h-10 px-6"
              >
                <Upload className="h-4 w-4 mr-2" />
                添加并上传图片
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearCurrent}
                className="h-10 px-6 text-gray-600 hover:text-gray-900"
              >
                清空
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 已选颜色列表 */}
      {selectedColors.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-600 font-medium">
                <th className="px-4 py-3 text-left">序号</th>
                <th className="px-4 py-3 text-left">色系</th>
                <th className="px-4 py-3 text-left">颜色</th>
                <th className="px-4 py-3 text-left">色系编码</th>
                <th className="px-4 py-3 text-left">颜色编码</th>
                <th className="px-4 py-3 text-left">颜色别名</th>
                <th className="px-4 py-3 text-left">款色</th>
                <th className="px-4 py-3 text-left">原厂款色货号</th>
                <th className="px-4 py-3 text-left">供应商名称</th>
                <th className="px-4 py-3 text-left">商品图片</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {selectedColors.map((color, index) => {
                // 计算款色 = 货号 + 色系编码 + 颜色编码
                const styleColor = productCode && color.groupCode && color.colorCode 
                  ? `${productCode}${color.groupCode}${color.colorCode}` 
                  : productCode || '-'
                
                return (
                  <tr
                    key={color.id}
                    className={`text-sm ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } border-t border-gray-100`}
                  >
                    <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900">{color.groupName}</td>
                    <td className="px-4 py-3 text-gray-900">{color.colorName}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{color.groupCode}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{color.colorCode}</td>
                    <td className="px-4 py-3 text-gray-900">{color.colorAlias}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{styleColor}</td>
                    <td className="px-4 py-3">
                      <Input
                        value={color.factoryColorCode || ''}
                        onChange={(e) => {
                          const newColors = selectedColors.map(c =>
                            c.id === color.id ? { ...c, factoryColorCode: e.target.value } : c
                          )
                          setSelectedColors(newColors)
                          onChange?.(newColors)
                        }}
                        placeholder="输入原厂货号"
                        className="h-8 text-xs w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={color.supplierId?.toString() || ''}
                        onValueChange={(value) => {
                          const supplier = suppliers.find(s => s.id === parseInt(value))
                          const supplierName = supplier?.name || supplier?.supplier_name
                          const newColors = selectedColors.map(c =>
                            c.id === color.id ? { ...c, supplierId: parseInt(value), supplierName } : c
                          )
                          setSelectedColors(newColors)
                          onChange?.(newColors)
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs w-32">
                          <SelectValue placeholder="选择供应商" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name || supplier.supplier_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      {color.image ? (
                        <div className="relative w-10 h-10 group">
                          <img
                            src={color.image}
                            alt={color.colorName}
                            className="w-full h-full object-cover rounded"
                          />
                          {/* 悬停时显示操作按钮 */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openImageSelector(color.id)}
                              className="h-6 w-6 p-0 text-white hover:text-white hover:bg-white/20"
                            >
                              <ImagePlus className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveColorImage(color.id)}
                              className="h-6 w-6 p-0 text-white hover:text-white hover:bg-white/20"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <label className={`cursor-pointer ${uploadingColorId === color.id ? 'pointer-events-none opacity-50' : ''}`}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleColorImageUpload(color.id, e)}
                              className="hidden"
                              disabled={uploadingColorId === color.id}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <span className="h-8 px-2 text-xs">
                                {uploadingColorId === color.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Upload className="h-3 w-3 mr-1" />
                                )}
                                上传
                              </span>
                            </Button>
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openImageSelector(color.id)}
                            className="h-8 px-2 text-xs"
                          >
                            <ImagePlus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveColor(color.id)}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 新增色系对话框 */}
      <Dialog open={isAddGroupDialogOpen} onOpenChange={setIsAddGroupDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">新增色系</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGroup}>
            <div className="space-y-5 py-4">
              <div>
                <Label htmlFor="newGroupName" className="text-sm font-semibold text-gray-700">
                  色系名称
                </Label>
                <Input
                  id="newGroupName"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                  placeholder="例如：紫色系"
                  required
                  className="mt-2 h-10 rounded-lg border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="newGroupCode" className="text-sm font-semibold text-gray-700">
                  色系代码
                </Label>
                <Input
                  id="newGroupCode"
                  value={newGroupData.code}
                  onChange={(e) => setNewGroupData({ ...newGroupData, code: e.target.value })}
                  placeholder="例如：purple"
                  required
                  className="mt-2 h-10 rounded-lg border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="newGroupCodeLength" className="text-sm font-semibold text-gray-700">
                  编码位数
                </Label>
                <Input
                  id="newGroupCodeLength"
                  type="number"
                  value={newGroupData.codeLength}
                  onChange={(e) => setNewGroupData({ ...newGroupData, codeLength: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                  required
                  className="mt-2 h-10 rounded-lg border-gray-200"
                />
              </div>
              <ColorPicker
                value={newGroupData.color}
                onChange={(color) => setNewGroupData({ ...newGroupData, color })}
                label="色系颜色"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddGroupDialogOpen(false)
                  setNewGroupData({ name: '', code: '', codeLength: 2, color: '#3B82F6' })
                }}
                className="h-10 rounded-lg px-6"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={addingGroup}
                className="h-10 rounded-lg px-6"
              >
                {addingGroup ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    添加中...
                  </>
                ) : (
                  '添加'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 新增颜色对话框 */}
      <Dialog open={isAddColorDialogOpen} onOpenChange={setIsAddColorDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              新增颜色 - {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddColor}>
            <div className="space-y-5 py-4">
              <div>
                <Label htmlFor="newColorName" className="text-sm font-semibold text-gray-700">
                  颜色名称
                </Label>
                <Input
                  id="newColorName"
                  value={newColorData.name}
                  onChange={(e) => setNewColorData({ ...newColorData, name: e.target.value })}
                  placeholder="例如：深紫"
                  required
                  className="mt-2 h-10 rounded-lg border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="newColorCode" className="text-sm font-semibold text-gray-700">
                  颜色代码
                </Label>
                <Input
                  id="newColorCode"
                  value={newColorData.code}
                  onChange={(e) => setNewColorData({ ...newColorData, code: e.target.value })}
                  placeholder="例如：darkpurple"
                  required
                  className="mt-2 h-10 rounded-lg border-gray-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddColorDialogOpen(false)
                  setNewColorData({ name: '', code: '' })
                }}
                className="h-10 rounded-lg px-6"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={addingColor}
                className="h-10 rounded-lg px-6"
              >
                {addingColor ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    添加中...
                  </>
                ) : (
                  '添加'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 图片空间选择器 */}
      <ImageSelector
        open={imageSelectorOpen}
        onOpenChange={setImageSelectorOpen}
        multiple={false}
        onSelect={handleImageSelect}
      />
        </>
      )}
    </div>
  )
}
