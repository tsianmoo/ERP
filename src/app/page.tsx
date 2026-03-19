'use client'

import { Package2, Building2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          欢迎使用服装ERP系统
        </h1>
        <p className="text-gray-600 text-lg">
          专业的服装行业ERP管理系统，帮助您高效管理商品和供应商信息
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">快速开始</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/products">
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">商品档案</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    管理商品信息、配置商品属性、颜色组、尺码组和货号规则
                  </p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    开始管理商品
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/suppliers">
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Building2 className="h6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">供应商档案</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    管理供应商信息，维护供应商档案和相关属性
                  </p>
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    开始管理供应商
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">系统功能</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">商品档案</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-1">商品列表</h4>
                  <p className="text-sm text-gray-600">查看和管理所有商品信息，支持搜索和编辑</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-1">基本信息管理</h4>
                  <p className="text-sm text-gray-600">自定义商品基本信息字段，支持多种数据类型</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-content text-gray-900 mb-1">商品属性</h4>
                  <p className="text-sm text-gray-600">配置品牌、年份、季节等商品属性分类</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-1">颜色组</h4>
                  <p className="text-sm text-gray-600">管理颜色分类、具体颜色和透明度</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-1">尺码组</h4>
                  <p className="text-sm text-gray-600">配置尺码分类和具体尺码规格</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-1">货号规则</h4>
                  <p className="text-sm text-gray-600">设置商品货号自动生成规则和条码格式</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">供应商档案</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-1">供应商列表</h4>
                  <p className="text-sm text-gray-600">查看和管理供应商信息</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-1">供应商属性</h4>
                  <p className="text-sm text-gray-600">配置供应商基本信息字段</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
