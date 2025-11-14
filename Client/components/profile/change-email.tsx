"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/label"
import { Button } from "@/components/ui/button"

interface Props {
  userEmail?: string
}

export default function ChangeEmailSection({ userEmail }: Props) {
  const [editing, setEditing] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e)

  const canSubmit = !loading && isValidEmail(newEmail) && password.length > 0

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch('/api/user/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim(), password }),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(body?.error || 'Failed to change email')
        setLoading(false)
        return
      }

      setSuccess(body?.message || 'Email change requested. Please verify your new email.')
      setNewEmail("")
      setPassword("")
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
      <div className="space-y-3">
        <h3 className="font-medium">Change email</h3>
        <div className="text-sm text-muted-foreground">Current: {userEmail || '—'}</div>
        <div className="flex gap-2 mt-2">
          <Button onClick={() => setEditing(true)}>Change email</Button>
        </div>
        {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-medium">Change email</h3>
      <div>
        <Label>Current email</Label>
        <div className="text-sm text-muted-foreground">{userEmail || '—'}</div>
      </div>

      <div>
        <Label>New email</Label>
        <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@domain.com" />
      </div>

      <div>
        <Label>Current password</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Current password" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={!canSubmit}>
          {loading ? 'Saving…' : 'Change email'}
        </Button>
        <Button variant="ghost" type="button" onClick={() => { setEditing(false); setNewEmail(''); setPassword(''); setError(null); setSuccess(null); }}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
