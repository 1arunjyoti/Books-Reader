"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function SyncProfileButton() {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(body?.error || 'Failed to sync profile')
        setSyncing(false)
        return
      }

      setSuccess('Profile synced successfully')
      setSyncing(false)
      
      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh()
      }, 500)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Network error')
      setSyncing(false)
    }
  }

  return (
    <div className="w-full pt-4 border-t border-gray-300 dark:border-gray-600">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Sync Profile</h3>
        <p className="text-xs text-muted-foreground">
          Sync your profile data from Clerk (email, name, picture) to the database.
          This is useful after verifying a new email address.
        </p>
        
        <Button 
          onClick={handleSync} 
          disabled={syncing}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync Profile'}
        </Button>

        {success && <p className="text-xs text-green-600">{success}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
