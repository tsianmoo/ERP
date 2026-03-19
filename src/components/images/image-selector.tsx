'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, X, Check, Folder, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface ImageCategory {
  id: number
  name: string
  type: 'manual' | 'attribute'
}

interface Image {
  id: number
  name: string
  url: string
  category_id?: number
  created_at: string
}

interface ImageSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (images: Image[]) => void
  multiple?: boolean
  selectedIds?: number[]
}

export function ImageSelector({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  selectedIds = [],
}: ImageSelectorProps) {
  const [categories, setCategories] = useState<ImageCategory[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set(selectedIds))
  const [loading, setLoading] = useState(false)

  // 使用 useMemo 稳定 selectedIdsKey
  const selectedIdsKey = useMemo(() => selectedIds.join(','), [selectedIds])

  useEffect(() => {
    if (open) {
      fetchCategories()
      fetchImages()
      setSelectedImages(new Set(selectedIds))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedIdsKey])

  useEffect(() => {
    if (open) {
      fetchImages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchTerm])

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

  const handleSelect = (image: Image) => {
    if (multiple) {
      const newSet = new Set(selectedImages)
      if (newSet.has(image.id)) {
        newSet.delete(image.id)
      } else {
        newSet.add(image.id)
      }
      setSelectedImages(newSet)
    } else {
      // 单选模式，直接返回
      onSelect([image])
      onOpenChange(false)
    }
  }

  const handleConfirm = () => {
    const selected = images.filter(img => selectedImages.has(img.id))
    onSelect(selected)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{multiple ? '选择图片' : '选择图片'}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[500px]">
          {/* 左侧分类 */}
          <div className="w-48 border-r pr-4 overflow-y-auto">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  selectedCategory === null ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                )}
              >
                <ImageIcon className="h-4 w-4" />
                全部图片
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    selectedCategory === category.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  )}
                >
                  <Folder className="h-4 w-4" />
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 右侧图片列表 */}
          <div className="flex-1 flex flex-col">
            {/* 搜索栏 */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索图片..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 图片网格 */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-12 text-gray-500">加载中...</div>
              ) : images.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无图片
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {images.map((image) => {
                    const isSelected = selectedImages.has(image.id)
                    return (
                      <div
                        key={image.id}
                        onClick={() => handleSelect(image)}
                        className={cn(
                          'relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all',
                          isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-200'
                        )}
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1">
                            <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                          <p className="text-[10px] text-white truncate">{image.name}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 底部操作栏 */}
            {multiple && (
              <div className="mt-4 flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-500">
                  已选 {selectedImages.size} 张图片
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    取消
                  </Button>
                  <Button onClick={handleConfirm} disabled={selectedImages.size === 0}>
                    确定
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
