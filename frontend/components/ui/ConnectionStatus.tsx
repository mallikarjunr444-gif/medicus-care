'use client'

import React from 'react'
import { Wifi, WifiOff, Activity, AlertCircle } from 'lucide-react'
import { useConnectionManager } from '@/lib/useConnectionManager'

export function ConnectionStatus() {
  const { isOnline, overallStatus, statusLabel } = useConnectionManager()

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      {overallStatus === 'offline' ? (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/80 border border-red-800 text-red-300">
          <WifiOff size={13} className="text-red-400" />
          <span>Offline</span>
        </span>
      ) : overallStatus === 'warning' ? (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-800 text-amber-300">
          <AlertCircle size={13} className="text-amber-400 animate-pulse" />
          <span>{statusLabel}</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">{statusLabel}</span>
        </span>
      )}
    </div>
  )
}
