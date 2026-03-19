'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Settings2, RotateCcw, Palette, Layout, Table, Component, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// 默认设置
const DEFAULT_SETTINGS: SystemSettings = {
  // 页面布局
  pagePadding: 24,           // 页面边距
  sectionGap: 16,            // 区域间距
  
  // 卡片样式
  cardRadius: 4,             // 卡片圆角
  cardPadding: 16,           // 卡片内边距
  cardBorderWidth: 1,        // 卡片边框宽度
  
  // 表格样式
  tableHeaderHeight: 44,     // 表头高度
  tableRowHeight: 40,        // 行高
  tableCellPadding: 12,      // 单元格内边距
  tableHeaderPadding: 8,     // 表头内边距
  
  // 组件样式
  buttonHeight: 28,          // 按钮高度
  buttonGap: 8,              // 按钮间距
  inputHeight: 28,           // 输入框高度
  formItemGap: 12,           // 表单项间距
  
  // 边框样式
  borderColor: '#e5e7eb',    // 边框颜色
  borderWidth: 1,            // 边框宽度
}

// 设置存储键
const STORAGE_KEY = 'system-settings-v2'

export interface SystemSettings {
  // 页面布局
  pagePadding: number
  sectionGap: number
  
  // 卡片样式
  cardRadius: number
  cardPadding: number
  cardBorderWidth: number
  
  // 表格样式
  tableHeaderHeight: number
  tableRowHeight: number
  tableCellPadding: number
  tableHeaderPadding: number
  
  // 组件样式
  buttonHeight: number
  buttonGap: number
  inputHeight: number
  formItemGap: number
  
  // 边框样式
  borderColor: string
  borderWidth: number
}

// 获取存储的设置
export function getStoredSettings(): SystemSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return DEFAULT_SETTINGS
}

// 应用设置到 CSS 变量
export function applySettings(settings: SystemSettings) {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  
  // 页面布局
  root.style.setProperty('--page-padding', `${settings.pagePadding}px`)
  root.style.setProperty('--section-gap', `${settings.sectionGap}px`)
  
  // 卡片样式
  root.style.setProperty('--card-radius', `${settings.cardRadius}px`)
  root.style.setProperty('--card-padding', `${settings.cardPadding}px`)
  root.style.setProperty('--card-border-width', `${settings.cardBorderWidth}px`)
  
  // 表格样式
  root.style.setProperty('--table-header-height', `${settings.tableHeaderHeight}px`)
  root.style.setProperty('--table-row-height', `${settings.tableRowHeight}px`)
  root.style.setProperty('--table-cell-padding', `${settings.tableCellPadding}px`)
  root.style.setProperty('--table-header-padding', `${settings.tableHeaderPadding}px`)
  
  // 组件样式
  root.style.setProperty('--button-height', `${settings.buttonHeight}px`)
  root.style.setProperty('--button-gap', `${settings.buttonGap}px`)
  root.style.setProperty('--input-height', `${settings.inputHeight}px`)
  root.style.setProperty('--form-item-gap', `${settings.formItemGap}px`)
  
  // 边框样式
  root.style.setProperty('--border-color', settings.borderColor)
  root.style.setProperty('--border-width', `${settings.borderWidth}px`)
  
  // 同时更新 --radius 以保持兼容
  root.style.setProperty('--radius', `${settings.cardRadius}px`)
}

// 保存设置到 localStorage
export function saveSettings(settings: SystemSettings) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

// 预设配置
const PRESETS = {
  compact: {
    label: '紧凑',
    icon: '紧凑',
    settings: {
      pagePadding: 16,
      sectionGap: 12,
      cardRadius: 2,
      cardPadding: 12,
      cardBorderWidth: 1,
      tableHeaderHeight: 36,
      tableRowHeight: 32,
      tableCellPadding: 8,
      tableHeaderPadding: 6,
      buttonHeight: 24,
      buttonGap: 6,
      inputHeight: 24,
      formItemGap: 8,
      borderColor: '#e5e7eb',
      borderWidth: 1,
    }
  },
  standard: {
    label: '标准',
    icon: '标准',
    settings: DEFAULT_SETTINGS
  },
  comfortable: {
    label: '舒适',
    icon: '舒适',
    settings: {
      pagePadding: 32,
      sectionGap: 20,
      cardRadius: 8,
      cardPadding: 20,
      cardBorderWidth: 1,
      tableHeaderHeight: 48,
      tableRowHeight: 44,
      tableCellPadding: 16,
      tableHeaderPadding: 10,
      buttonHeight: 32,
      buttonGap: 10,
      inputHeight: 32,
      formItemGap: 16,
      borderColor: '#e5e7eb',
      borderWidth: 1,
    }
  },
  spacious: {
    label: '宽松',
    icon: '宽松',
    settings: {
      pagePadding: 40,
      sectionGap: 24,
      cardRadius: 12,
      cardPadding: 24,
      cardBorderWidth: 1,
      tableHeaderHeight: 52,
      tableRowHeight: 48,
      tableCellPadding: 20,
      tableHeaderPadding: 12,
      buttonHeight: 36,
      buttonGap: 12,
      inputHeight: 36,
      formItemGap: 20,
      borderColor: '#e5e7eb',
      borderWidth: 1,
    }
  }
}

export function SystemSettingsDialog() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('layout')

  // 加载已保存的设置
  useEffect(() => {
    const stored = getStoredSettings()
    setSettings(stored)
    applySettings(stored)
  }, [])

  // 处理设置变更
  const handleSettingChange = (key: keyof SystemSettings, value: number | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // 应用预设
  const handleApplyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey]
    setSettings(preset.settings)
    setHasChanges(true)
  }

  // 应用设置
  const handleApply = () => {
    applySettings(settings)
    saveSettings(settings)
    setHasChanges(false)
    toast.success('设置已保存')
  }

  // 重置为默认值
  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    applySettings(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
    setHasChanges(false)
    toast.success('已恢复默认设置')
  }

  // 渲染滑块设置项
  const renderSliderSetting = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    key: keyof SystemSettings,
    unit: string = 'px',
    description?: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded min-w-[48px] text-center">
          {value}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => handleSettingChange(key, v)}
        className="w-full"
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors w-full">
          <Settings2 className="h-4 w-4" />
          系统设置
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            系统设置
          </DialogTitle>
        </DialogHeader>
        
        {/* 预设配置 */}
        <div className="flex gap-2 py-2 border-b border-gray-100">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handleApplyPreset(key as keyof typeof PRESETS)}
              className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                JSON.stringify(settings) === JSON.stringify(preset.settings)
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-4 h-9">
            <TabsTrigger value="layout" className="text-xs py-1.5">
              <Layout className="h-3.5 w-3.5 mr-1" />
              布局
            </TabsTrigger>
            <TabsTrigger value="card" className="text-xs py-1.5">
              <Square className="h-3.5 w-3.5 mr-1" />
              卡片
            </TabsTrigger>
            <TabsTrigger value="table" className="text-xs py-1.5">
              <Table className="h-3.5 w-3.5 mr-1" />
              表格
            </TabsTrigger>
            <TabsTrigger value="component" className="text-xs py-1.5">
              <Component className="h-3.5 w-3.5 mr-1" />
              组件
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto py-4">
            {/* 布局设置 */}
            <TabsContent value="layout" className="space-y-4 mt-0">
              {renderSliderSetting('页面边距', settings.pagePadding, 0, 64, 4, 'pagePadding', 'px', '页面内容与边缘的间距')}
              {renderSliderSetting('区域间距', settings.sectionGap, 8, 32, 2, 'sectionGap', 'px', '页面各区域之间的间距')}
            </TabsContent>

            {/* 卡片设置 */}
            <TabsContent value="card" className="space-y-4 mt-0">
              {renderSliderSetting('卡片圆角', settings.cardRadius, 0, 24, 1, 'cardRadius', 'px', '卡片、弹窗等容器的圆角')}
              {renderSliderSetting('卡片内边距', settings.cardPadding, 8, 32, 2, 'cardPadding', 'px', '卡片内容的内边距')}
              {renderSliderSetting('卡片边框宽度', settings.cardBorderWidth, 0, 3, 1, 'cardBorderWidth', 'px', '卡片边框粗细')}
              
              {/* 边框颜色选择器 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">边框颜色</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.borderColor}
                      onChange={(e) => handleSettingChange('borderColor', e.target.value)}
                      className="w-8 h-6 rounded cursor-pointer border border-gray-200"
                    />
                    <span className="text-sm text-gray-600 font-mono">{settings.borderColor}</span>
                  </div>
                </div>
              </div>
              
              {/* 卡片预览 */}
              <div className="p-4 bg-gray-50 rounded-lg mt-4">
                <span className="text-xs text-gray-500 mb-2 block">预览效果：</span>
                <div 
                  className="bg-white"
                  style={{
                    borderRadius: `${settings.cardRadius}px`,
                    padding: `${settings.cardPadding}px`,
                    borderWidth: `${settings.cardBorderWidth}px`,
                    borderColor: settings.borderColor,
                    borderStyle: 'solid'
                  }}
                >
                  <div className="text-sm font-medium text-gray-900 mb-2">卡片标题</div>
                  <div className="text-xs text-gray-600">卡片内容示例文本</div>
                </div>
              </div>
            </TabsContent>

            {/* 表格设置 */}
            <TabsContent value="table" className="space-y-4 mt-0">
              {renderSliderSetting('表头高度', settings.tableHeaderHeight, 32, 60, 2, 'tableHeaderHeight', 'px', '表格标题行高度')}
              {renderSliderSetting('行高', settings.tableRowHeight, 28, 56, 2, 'tableRowHeight', 'px', '表格数据行高度')}
              {renderSliderSetting('单元格内边距', settings.tableCellPadding, 4, 24, 2, 'tableCellPadding', 'px', '表格单元格内边距')}
              {renderSliderSetting('表头内边距', settings.tableHeaderPadding, 4, 16, 1, 'tableHeaderPadding', 'px', '表头单元格内边距')}
              
              {/* 表格预览 */}
              <div className="p-4 bg-gray-50 rounded-lg mt-4">
                <span className="text-xs text-gray-500 mb-2 block">预览效果：</span>
                <div 
                  className="overflow-hidden border"
                  style={{ borderColor: settings.borderColor }}
                >
                  <div 
                    className="flex bg-gray-100 font-medium text-gray-700"
                    style={{ 
                      height: `${settings.tableHeaderHeight}px`,
                      padding: `${settings.tableHeaderPadding}px`
                    }}
                  >
                    <div className="flex-1">列标题</div>
                    <div className="flex-1">列标题</div>
                  </div>
                  <div 
                    className="flex border-t text-gray-600"
                    style={{ 
                      height: `${settings.tableRowHeight}px`,
                      padding: `${settings.tableCellPadding}px`,
                      borderColor: settings.borderColor
                    }}
                  >
                    <div className="flex-1">数据内容</div>
                    <div className="flex-1">数据内容</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 组件设置 */}
            <TabsContent value="component" className="space-y-4 mt-0">
              {renderSliderSetting('按钮高度', settings.buttonHeight, 20, 40, 2, 'buttonHeight', 'px', '按钮组件高度')}
              {renderSliderSetting('按钮间距', settings.buttonGap, 4, 16, 1, 'buttonGap', 'px', '按钮之间的间距')}
              {renderSliderSetting('输入框高度', settings.inputHeight, 20, 40, 2, 'inputHeight', 'px', '输入框组件高度')}
              {renderSliderSetting('表单项间距', settings.formItemGap, 8, 24, 2, 'formItemGap', 'px', '表单项之间的间距')}
              
              {/* 组件预览 */}
              <div className="p-4 bg-gray-50 rounded-lg mt-4">
                <span className="text-xs text-gray-500 mb-2 block">预览效果：</span>
                <div className="space-y-2">
                  <div className="flex gap-2" style={{ gap: `${settings.buttonGap}px` }}>
                    <button 
                      className="px-4 bg-blue-500 text-white text-sm"
                      style={{ height: `${settings.buttonHeight}px`, borderRadius: `${settings.cardRadius}px` }}
                    >
                      主按钮
                    </button>
                    <button 
                      className="px-4 bg-white border text-gray-700 text-sm"
                      style={{ height: `${settings.buttonHeight}px`, borderRadius: `${settings.cardRadius}px` }}
                    >
                      次按钮
                    </button>
                  </div>
                  <input 
                    type="text"
                    placeholder="输入框示例"
                    className="w-full px-3 border text-sm"
                    style={{ height: `${settings.inputHeight}px`, borderRadius: `${settings.cardRadius}px` }}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* 底部操作按钮 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-600"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            恢复默认
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!hasChanges}
              className="bg-blue-500 hover:bg-blue-600"
            >
              应用设置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
