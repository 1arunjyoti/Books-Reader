"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useClerk, useUser } from "@clerk/nextjs"
import { useAuthToken } from "@/contexts/AuthTokenContext"
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
import { AlertCircle } from "lucide-react"

interface Props {
  userEmail?: string
}

export default function DeleteAccountSection({ userEmail }: Props) {
  const router = useRouter()
  const { signOut } = useClerk()
  const { user } = useUser()
  const { clearToken } = useAuthToken()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsReauth, setNeedsReauth] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const canDelete =
    email.trim().toLowerCase() === userEmail?.trim().toLowerCase() &&
    confirmText === "DELETE" &&
    password.length > 0 &&
    !loading &&
    !needsReauth

  // Check if user needs re-authentication (session older than 5 minutes)
  useEffect(() => {
    if (isOpen && user) {
      const lastSignInAt = user.lastSignInAt;
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      
      if (lastSignInAt && new Date(lastSignInAt).getTime() < fiveMinutesAgo) {
        setNeedsReauth(true);
      } else {
        setNeedsReauth(false);
      }
    }
  }, [isOpen, user]);

  async function handleReauthenticate() {
    // Redirect to sign-in with return URL
    router.push('/sign-in?redirect_url=/profile&action=delete-account');
  }

  async function handleDelete() {
    setError(null)
    if (!canDelete) return
    
    // Final authentication check
    if (needsReauth) {
      setError('Please sign in again to delete your account')
      return
    }
    
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

      // On success, clear the cached token first
      clearToken()
      
      // Then sign out with Clerk and redirect to home page
      await signOut({ redirectUrl: '/' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Network error')
      setLoading(false)
    }
  }

  return (
    <div className=" border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium mb-1">Delete account</h3>
          <p className="text-sm text-muted-foreground ">Permanently delete your account and all associated data. This action cannot be undone.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

            {needsReauth && (
              <div className="flex items-start gap-2 p-3 mb-2 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Re-authentication Required</p>
                  <p>
                    For security, you need to sign in again before deleting your account. 
                    Your session is older than 5 minutes.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleDelete(); }} className="flex flex-col flex-1">
              <div className="grid gap-3 pb-4 flex-1">
              <div>
                <Label>Email</Label>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder={userEmail} 
                  autoComplete="email"
                  disabled={needsReauth}
                />
                <p className="text-xs text-muted-foreground mt-1">Type your account email exactly: <span className="font-semibold">{userEmail}</span></p>
              </div>

              <div>
                <Label>Password</Label>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Current password" 
                  autoComplete="current-password"
                  disabled={needsReauth}
                />
              </div>                
              
              <div>
                  <Label>Type-to-confirm</Label>
                  <Input 
                    value={confirmText} 
                    onChange={(e) => setConfirmText(e.target.value)} 
                    placeholder="Type DELETE to confirm"
                    disabled={needsReauth}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" className="cursor-pointer">Cancel</Button>
                </DialogClose>
                
                {needsReauth ? (
                  <Button 
                    type="button" 
                    variant="default" 
                    className="cursor-pointer"
                    onClick={handleReauthenticate}
                  >
                    Sign In Again
                  </Button>
                ) : (
                  <Button type="submit" variant="destructive" className="cursor-pointer" disabled={!canDelete}>
                    {loading ? 'Deleting…' : 'Delete account'}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
