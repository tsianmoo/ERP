'use client'

import { useEffect } from 'react'
import { getStoredSettings, applySettings } from './system-settings'

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 初始化时应用存储的设置
    const settings = getStoredSettings()
    applySettings(settings)
  }, [])

  return <>{children}</>
}
