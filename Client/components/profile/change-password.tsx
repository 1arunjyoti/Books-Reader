"use client"

import React, { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/label"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function ChangePasswordSection() {
  const { user } = useUser()
  const [editing, setEditing] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const strongEnough = (p: string) => p.length >= 8

  const canSubmit = !loading && strongEnough(newPassword) && newPassword === confirmPassword && currentPassword.length > 0

  // Check if password auth is enabled
  const hasPasswordAuth = user?.passwordEnabled !== false

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Note: With Clerk, we trust the authenticated session
      // The current password field provides user confirmation
      // Clerk will handle password validation on their side
      
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(body?.error || 'Failed to change password')
        setLoading(false)
        return
      }

      setSuccess(body?.message || 'Password changed successfully')
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setLoading(false)
      setEditing(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Network error')
      setLoading(false)
    }
  }
  if (!editing) {
    return (
      <div className="">
        <h3 className="font-medium">Change password</h3>
        
        {!hasPasswordAuth && (
          <div className="flex items-start gap-2 p-3 mb-2 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>
              You signed up using a social provider (Google, GitHub, etc.). 
              Password change is not available for social accounts.
            </p>
          </div>
        )}
        
        <div className="flex flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-2">Change your password regularly to keep your account secure.</p>
          
          <div className="flex gap-2 items-center">
            <Button onClick={() => setEditing(true)} disabled={!hasPasswordAuth}>
              Change password
            </Button>
          </div>
        </div>
        
        {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-medium">Change password</h3>

      <div>
        <Label>Current password</Label>
        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
      </div>

      <div>
        <Label>New password</Label>
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" />
      </div>

      <div>
        <Label>Confirm new password</Label>
        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
      </div>

      {!strongEnough(newPassword) && newPassword.length > 0 && (
        <p className="text-sm text-muted-foreground">Password should be at least 8 characters.</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={!canSubmit}>
          {loading ? 'Saving…' : 'Change password'}
        </Button>
        <Button variant="ghost" type="button" onClick={() => { setEditing(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(null); setSuccess(null); }}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
