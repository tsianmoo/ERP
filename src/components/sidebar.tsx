'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Package2, 
  Settings2, 
  Tags, 
  Palette, 
  Ruler, 
  ScanBarcode,
  Building2,
  ImageIcon
} from 'lucide-react'
import { SystemSettingsDialog } from '@/components/system-settings'

const navigation = [
  {
    name: '商品档案',
    icon: Package2,
    children: [
      { name: '商品列表', href: '/products' },
      { name: '基本信息管理', href: '/products/basic-info' },
      { name: '商品属性', href: '/products/attributes' },
      { name: '颜色组', href: '/products/colors' },
      { name: '尺码组', href: '/products/sizes' },
      { name: '编码规则', href: '/products/code-rules' },
    ],
  },
  {
    name: '供应商档案',
    icon: Building2,
    children: [
      { name: '供应商列表', href: '/suppliers' },
      { name: '供应商属性', href: '/suppliers/attributes' },
    ],
  },
  {
    name: '图片空间',
    icon: ImageIcon,
    children: [
      { name: '图片管理', href: '/images' },
      { name: '分类管理', href: '/images/categories' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-[180px] border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-100">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            服装ERP
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="space-y-1">
            {navigation.map((section) => (
              <li key={section.name}>
                <div className="mb-2 flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500">
                  <section.icon className="h-4 w-4" />
                  {section.name}
                </div>
                <ul className="space-y-0.5">
                  {section.children.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                            isActive
                              ? 'bg-gray-100 text-gray-900 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 px-3 py-3 space-y-1">
          <SystemSettingsDialog />
          <p className="text-xs text-gray-400 text-center pt-1">
            © 2024 服装ERP系统
          </p>
        </div>
      </div>
    </aside>
  )
}
