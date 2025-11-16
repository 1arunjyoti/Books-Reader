"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/label"

interface Props {
  userEmail?: string
}

export default function DeleteAccountSection({ userEmail }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete =
    email.trim().toLowerCase() === userEmail?.trim().toLowerCase() &&
    confirmText === "DELETE" &&
    password.length > 0 &&
    !loading

  async function handleDelete() {
    setError(null)
    if (!canDelete) return
    setLoading(true)
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error || 'Failed to delete account')
        setLoading(false)
        return
      }

      // On success, logout and redirect to home page
      // The logout will clear the session
      router.push('/api/auth/logout')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Network error')
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 border border-gray-400 dark:border-gray-500 rounded-lg px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium mb-1">Delete account</h3>
          <p className="text-sm text-muted-foreground ">Permanently delete your account and all associated data. This action cannot be undone.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="cursor-pointer">Delete account</Button>
          </DialogTrigger>
          <DialogContent className="rounded-lg max-w-[40vh] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>Confirm account deletion</DialogTitle>
              <DialogDescription>
                This will permanently delete your account. To confirm, type <span className="font-mono font-bold">DELETE</span> below and enter your email and password.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => { e.preventDefault(); handleDelete(); }} className="flex flex-col flex-1">
              <div className="grid gap-3 pb-4 flex-1">
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={userEmail} autoComplete="email" />
                <p className="text-xs text-muted-foreground mt-1">Type your account email exactly: <span className="font-semibold">{userEmail}</span></p>
              </div>

              <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Current password" autoComplete="current-password" />
              </div>                <div>
                  <Label>Type-to-confirm</Label>
                  <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE to confirm" />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" className="cursor-pointer">Cancel</Button>
                </DialogClose>
                <Button type="submit" variant="destructive" className="cursor-pointer" disabled={!canDelete}>
                  {loading ? 'Deleting…' : 'Delete account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
