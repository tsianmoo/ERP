'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Activity, Server, Database, Cpu, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

interface BackendStatus {
  status: 'UP' | 'DOWN' | 'checking'
  timestamp?: string
  service?: string
  port?: string
  database?: {
    status: string
    database?: string
    error?: string
  }
  jvm?: {
    maxMemory: string
    totalMemory: string
    freeMemory: string
    usedMemory: string
    availableProcessors: number
  }
  error?: string
}

export function BackendStatusIndicator() {
  const [status, setStatus] = useState<BackendStatus>({ status: 'checking' })
  const [loading, setLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setStatus(data)
      setLastCheck(new Date())
    } catch (error) {
      setStatus({
        status: 'DOWN',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    // 每 30 秒检查一次
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (status.status) {
      case 'UP':
        return 'bg-green-500'
      case 'DOWN':
        return 'bg-red-500'
      case 'checking':
        return 'bg-yellow-500 animate-pulse'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'UP':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'DOWN':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="hidden sm:inline">
            {status.status === 'UP' ? '后端正常' : status.status === 'DOWN' ? '后端异常' : '检查中...'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              {getStatusIcon()}
              后端服务状态
            </h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={checkStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* 总体状态 */}
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-sm text-muted-foreground">状态</span>
            <Badge variant={status.status === 'UP' ? 'default' : 'destructive'}>
              {status.status}
            </Badge>
          </div>

          {status.error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {status.error}
            </div>
          )}

          {/* 服务信息 */}
          {status.status === 'UP' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Server className="h-3 w-3" /> 服务
                  </span>
                  <span>{status.service}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">端口</span>
                  <span>{status.port}</span>
                </div>
              </div>

              {/* 数据库状态 */}
              {status.database && (
                <div className="p-2 bg-muted rounded space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Database className="h-3 w-3" /> 数据库
                    </span>
                    <Badge variant={status.database.status === 'UP' ? 'default' : 'destructive'} className="text-xs">
                      {status.database.status}
                    </Badge>
                  </div>
                  {status.database.database && (
                    <div className="text-xs text-muted-foreground truncate">
                      {status.database.database}
                    </div>
                  )}
                </div>
              )}

              {/* JVM 信息 */}
              {status.jvm && (
                <div className="p-2 bg-muted rounded space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Cpu className="h-3 w-3" /> JVM 内存
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">已用:</span> {status.jvm.usedMemory}
                    </div>
                    <div>
                      <span className="text-muted-foreground">最大:</span> {status.jvm.maxMemory}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 最后检查时间 */}
          {lastCheck && (
            <div className="text-xs text-muted-foreground text-right">
              最后检查: {lastCheck.toLocaleTimeString()}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
