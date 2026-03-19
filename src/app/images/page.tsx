'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Search, FolderPlus, Image as ImageIcon, Upload, X, Check, Folder, Grid, List, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface ImageCategory {
  id: number
  name: string
  type: 'manual' | 'attribute'
  attribute_code?: string
  sort_order: number
}

interface Image {
  id: number
  name: string
  url: string
  category_id?: number
  file_size?: number
  width?: number
  height?: number
  created_at: string
  image_categories?: ImageCategory
}

interface Attribute {
  id: number
  name: string
  code: string
  product_attribute_values?: { id: number; code: string; name: string }[]
}

export default function ImageGalleryPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<ImageCategory[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 弹窗状态
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [editingCategory, setEditingCategory] = useState<ImageCategory | null>(null)
  const [editingImage, setEditingImage] = useState<Image | null>(null)

  // 表单状态
  const [categoryName, setCategoryName] = useState('')
  const [categoryType, setCategoryType] = useState<'manual' | 'attribute'>('manual')
  const [selectedAttribute, setSelectedAttribute] = useState<string>('')
  const [newImageName, setNewImageName] = useState('')

  // 批量选择
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set())
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchImages()
    fetchAttributes()
  }, [])

  useEffect(() => {
    fetchImages()
  }, [selectedCategory, searchTerm])

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPreviewOpen) return
      
      if (e.key === 'ArrowLeft') {
        prevImage()
      } else if (e.key === 'ArrowRight') {
        nextImage()
      } else if (e.key === 'Escape') {
        setIsPreviewOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPreviewOpen, images.length])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/images/categories')
      const result = await response.json()
      if (result.data) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  const fetchImages = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) {
        params.append('categoryId', String(selectedCategory))
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/images?${params.toString()}`)
      const result = await response.json()
      if (result.data) {
        setImages(result.data)
      }
    } catch (error) {
      console.error('获取图片失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttributes = async () => {
    try {
      const response = await fetch('/api/products/attributes')
      const result = await response.json()
      if (result.data) {
        setAttributes(result.data)
      }
    } catch (error) {
      console.error('获取属性失败:', error)
    }
  }

  // 创建/更新分类
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast({ title: '提示', description: '请输入分类名称', variant: 'destructive' })
      return
    }

    try {
      const body: any = {
        name: categoryName,
        type: categoryType,
      }

      if (categoryType === 'attribute' && selectedAttribute) {
        body.attributeCode = selectedAttribute
      }

      let response
      if (editingCategory) {
        response = await fetch('/api/images/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, id: editingCategory.id }),
        })
      } else {
        response = await fetch('/api/images/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (response.ok) {
        setIsCategoryDialogOpen(false)
        setCategoryName('')
        setCategoryType('manual')
        setSelectedAttribute('')
        setEditingCategory(null)
        fetchCategories()
        toast({ title: '成功', description: editingCategory ? '分类已更新' : '分类已创建' })
      }
    } catch (error) {
      console.error('保存分类失败:', error)
    }
  }

  // 删除分类
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('确定要删除此分类吗？分类下的图片将移至未分类。')) return

    try {
      const response = await fetch(`/api/images/categories?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCategories()
        if (selectedCategory === id) {
          setSelectedCategory(null)
        }
        toast({ title: '成功', description: '分类已删除' })
      }
    } catch (error) {
      console.error('删除分类失败:', error)
    }
  }

  // 上传图片
  const handleUpload = async (files: FileList) => {
    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', `images/${Date.now()}_${file.name}`)

        // 调用上传API
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('上传失败')
        }

        const uploadResult = await uploadResponse.json()

        // 保存图片信息到数据库
        const saveResponse = await fetch('/api/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name.split('.')[0],
            url: uploadResult.url,
            categoryId: selectedCategory,
            fileSize: file.size,
          }),
        })

        return saveResponse.ok
      })

      const results = await Promise.all(uploadPromises)
      const successCount = results.filter(Boolean).length

      setIsUploadDialogOpen(false)
      fetchImages()
      toast({ title: '成功', description: `成功上传 ${successCount} 张图片` })
    } catch (error) {
      console.error('上传失败:', error)
      toast({ title: '错误', description: '上传失败，请重试', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  // 重命名图片
  const handleRenameImage = async () => {
    if (!editingImage || !newImageName.trim()) return

    try {
      const response = await fetch('/api/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingImage.id,
          name: newImageName,
        }),
      })

      if (response.ok) {
        setIsRenameDialogOpen(false)
        setEditingImage(null)
        setNewImageName('')
        fetchImages()
        toast({ title: '成功', description: '图片名称已更新' })
      }
    } catch (error) {
      console.error('重命名失败:', error)
    }
  }

  // 删除图片
  const handleDeleteImage = async (id: number) => {
    if (!confirm('确定要删除此图片吗？')) return

    try {
      const response = await fetch(`/api/images?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchImages()
        toast({ title: '成功', description: '图片已删除' })
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedImages.size === 0) return
    if (!confirm(`确定要删除选中的 ${selectedImages.size} 张图片吗？`)) return

    try {
      const deletePromises = Array.from(selectedImages).map(id =>
        fetch(`/api/images?id=${id}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)
      setSelectedImages(new Set())
      fetchImages()
      toast({ title: '成功', description: '图片已删除' })
    } catch (error) {
      console.error('批量删除失败:', error)
    }
  }

  // 批量移动
  const handleBatchMove = async (categoryId: number | null) => {
    if (selectedImages.size === 0) return

    try {
      const movePromises = Array.from(selectedImages).map(id =>
        fetch('/api/images', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, categoryId }),
        })
      )

      await Promise.all(movePromises)
      setSelectedImages(new Set())
      fetchImages()
      toast({ title: '成功', description: '图片已移动' })
    } catch (error) {
      console.error('批量移动失败:', error)
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 打开图片预览
  const openPreview = (index: number) => {
    setPreviewIndex(index)
    setIsPreviewOpen(true)
  }

  // 上一张
  const prevImage = () => {
    setPreviewIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  // 下一张
  const nextImage = () => {
    setPreviewIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">图片空间</h1>
        <p className="text-gray-600 text-sm">管理和分类商品图片</p>
      </div>

      <div className="flex gap-6">
        {/* 左侧分类栏 */}
        <div className="w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">分类</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryName('')
                    setCategoryType('manual')
                    setSelectedAttribute('')
                    setIsCategoryDialogOpen(true)
                  }}
                  className="h-7 w-7 p-0"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === null ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  全部图片
                </button>

                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`group flex items-center justify-between rounded-md ${
                      selectedCategory === category.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex-1 flex items-center gap-2 px-3 py-2 text-sm"
                    >
                      <Folder className="h-4 w-4" />
                      <span className="truncate">{category.name}</span>
                      {category.type === 'attribute' && (
                        <span className="text-[10px] text-gray-400">属性</span>
                      )}
                    </button>
                    <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category)
                          setCategoryName(category.name)
                          setCategoryType(category.type)
                          setSelectedAttribute(category.attribute_code || '')
                          setIsCategoryDialogOpen(true)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1">
          {/* 工具栏 */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索图片..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* 视图切换 */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedImages.size > 0 && (
                <>
                  <span className="text-sm text-gray-500">
                    已选 {selectedImages.size} 项
                  </span>
                  <Select onValueChange={(value) => handleBatchMove(value === 'none' ? null : parseInt(value))}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue placeholder="移动到..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未分类</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </>
              )}
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                上传图片
              </Button>
            </div>
          </div>

          {/* 图片列表 */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              暂无图片，点击"上传图片"添加
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-6 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div 
                    className="aspect-square relative cursor-pointer"
                    onClick={() => openPreview(index)}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    {/* 悬停遮罩 */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute top-2 left-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedImages.has(image.id)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedImages)
                          if (checked) {
                            newSet.add(image.id)
                          } else {
                            newSet.delete(image.id)
                          }
                          setSelectedImages(newSet)
                        }}
                      />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingImage(image)
                          setNewImageName(image.name)
                          setIsRenameDialogOpen(true)
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs truncate">{image.name}</p>
                    <p className="text-[10px] text-gray-400">{formatFileSize(image.file_size)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border rounded-lg divide-y">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedImages.has(image.id)}
                    onCheckedChange={(checked) => {
                      const newSet = new Set(selectedImages)
                      if (checked) {
                        newSet.add(image.id)
                      } else {
                        newSet.delete(image.id)
                      }
                      setSelectedImages(newSet)
                    }}
                  />
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openPreview(index)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{image.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(image.file_size)}
                      {image.image_categories && ` · ${image.image_categories.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPreview(index)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingImage(image)
                        setNewImageName(image.name)
                        setIsRenameDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteImage(image.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 分类弹窗 */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '新建分类'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>分类名称</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="请输入分类名称"
                className="mt-1"
              />
            </div>
            <div>
              <Label>分类类型</Label>
              <Select value={categoryType} onValueChange={(v) => setCategoryType(v as 'manual' | 'attribute')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">手动分类</SelectItem>
                  <SelectItem value="attribute">按商品属性分类</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {categoryType === 'attribute' && (
              <div>
                <Label>关联属性</Label>
                <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择属性" />
                  </SelectTrigger>
                  <SelectContent>
                    {attributes.map((attr) => (
                      <SelectItem key={attr.code} value={attr.code}>
                        {attr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveCategory}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 上传弹窗 */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>上传图片</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">点击或拖拽上传图片</p>
              <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、GIF 格式</p>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </label>
            {isUploading && (
              <div className="mt-4 text-center text-sm text-gray-500">
                上传中...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 重命名弹窗 */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>重命名图片</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newImageName}
              onChange={(e) => setNewImageName(e.target.value)}
              placeholder="请输入图片名称"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRenameImage}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 图片预览弹窗 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black/95">
          <DialogHeader className="sr-only">
            <DialogTitle>图片预览</DialogTitle>
          </DialogHeader>
          {/* 关闭按钮 */}
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* 图片信息 */}
          <div className="absolute top-4 left-4 z-50 text-white">
            <p className="text-sm font-medium">{images[previewIndex]?.name}</p>
            <p className="text-xs text-gray-300">
              {previewIndex + 1} / {images.length}
            </p>
          </div>

          {/* 上一张按钮 */}
          {images.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* 图片 */}
          <div className="flex items-center justify-center min-h-[70vh]">
            {images[previewIndex] && (
              <img
                src={images[previewIndex].url}
                alt={images[previewIndex].name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>

          {/* 下一张按钮 */}
          {images.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* 缩略图导航 */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-3 px-4">
              <div className="flex items-center justify-center gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    onClick={() => setPreviewIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                      index === previewIndex
                        ? 'border-white scale-110'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
