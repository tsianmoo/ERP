'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, Search, Loader2, FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface Supplier {
  id: number
  supplier_code: string
  supplier_name: string
  status: string
  created_at: string
  updated_at: string
}

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const result = await response.json()
      if (result.data) {
        setSuppliers(result.data)
      }
    } catch (error) {
      console.error('获取供应商列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (supplierId: number) => {
    router.push(`/suppliers/${supplierId}/edit`)
  }

  const handleDelete = async (supplierId: number) => {
    if (!confirm('确定要删除这个供应商吗？')) return

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchSuppliers()
        toast({
          title: '删除成功',
          description: '供应商已删除',
        })
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除供应商失败:', error)
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: '请重试',
      })
    }
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">供应商列表</h1>
        <p className="text-gray-600 text-sm">管理所有供应商信息</p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索供应商名称或编码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => router.push('/suppliers/new')}
          >
            <FilePlus className="h-4 w-4 mr-2" />
            添加供应商
          </Button>
        </div>
      </div>

      {/* Supplier Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[200px]">供应商编码</TableHead>
              <TableHead>供应商名称</TableHead>
              <TableHead className="w-[120px]">状态</TableHead>
              <TableHead className="w-[180px]">创建时间</TableHead>
              <TableHead className="w-[150px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  暂无供应商数据
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {supplier.supplier_code}
                  </TableCell>
                  <TableCell>{supplier.supplier_name}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status === 'active' ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(supplier.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(supplier.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
