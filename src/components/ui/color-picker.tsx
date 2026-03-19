'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// 彩色系
const COLORFUL_COLORS = [
  '#3B82F6', // 蓝色
  '#EF4444', // 红色
  '#10B981', // 绿色
  '#F59E0B', // 橙色
  '#8B5CF6', // 紫色
  '#EC4899', // 粉色
  '#6366F1', // 靛蓝
  '#14B8A6', // 青色
  '#F97316', // 深橙
  '#84CC16', // 柠檬绿
  '#06B6D4', // 天蓝
  '#A855F7', // 深紫
  '#0EA5E9', // 海蓝
  '#059669', // 青绿
  '#E11D48', // 玫瑰
  '#92400E', // 棕色
  '#D97706', // 米色
]

// 黑白灰系
const MONOCHROME_COLORS = [
  '#000000', // 黑色
  '#1F2937', // 深黑灰
  '#374151', // 深灰
  '#4B5563', // 中深灰
  '#6B7280', // 中灰
  '#9CA3AF', // 浅灰
  '#D1D5DB', // 淡灰
  '#E5E7EB', // 很浅灰
  '#F3F4F6', // 极浅灰
  '#FFFFFF', // 白色
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      {/* 彩色系 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-medium">彩色系</div>
        <div className="flex flex-wrap gap-2">
          {COLORFUL_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all hover:scale-110',
                value === color ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-400'
              )}
              style={{ backgroundColor: color }}
            >
              {value === color && (
                <Check className="w-5 h-5 text-white mx-auto mt-1.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 黑白灰系 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-medium">黑白灰系</div>
        <div className="flex flex-wrap gap-2">
          {MONOCHROME_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all hover:scale-110',
                value === color ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-400'
              )}
              style={{ backgroundColor: color }}
            >
              {value === color && (
                <Check 
                  className="w-5 h-5 mx-auto mt-1.5" 
                  style={{ color: color === '#FFFFFF' || color === '#F3F4F6' || color === '#E5E7EB' ? '#000000' : '#FFFFFF' }} 
                />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* 自定义颜色选择 */}
      <div className="flex items-center gap-2 pt-2">
        <div className="text-xs text-gray-500 font-medium">自定义颜色:</div>
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'w-8 h-8 rounded-full border-2 cursor-pointer transition-all hover:scale-110',
              !COLORFUL_COLORS.includes(value) && !MONOCHROME_COLORS.includes(value) 
                ? 'border-gray-900 shadow-md' 
                : 'border-gray-200 hover:border-gray-400'
            )}
            title="自定义颜色"
          />
          {!COLORFUL_COLORS.includes(value) && !MONOCHROME_COLORS.includes(value) && (
            <Check 
              className="w-5 h-5 absolute top-1.5 left-1.5 pointer-events-none"
              style={{ color: value === '#FFFFFF' || value === '#F3F4F6' || value === '#E5E7EB' ? '#000000' : '#FFFFFF' }} 
            />
          )}
        </div>

        {/* 当前颜色预览 */}
        <div className="flex items-center gap-2 ml-4">
          <div
            className="w-8 h-8 rounded border border-gray-200"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm text-gray-600">{value}</span>
        </div>
      </div>
    </div>
  )
}
