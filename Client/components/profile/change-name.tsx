"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Edit2, Check, X, AlertCircle } from "lucide-react"

interface Props {
  initialName?: string
  onNameUpdate?: (newName: string) => void
}

const MAX_NAME_LENGTH = 25;
const DEBOUNCE_DELAY = 300; // milliseconds

export default function ChangeNameSection({ initialName = "", onNameUpdate }: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [successTimer, setSuccessTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setDisplayName(initialName)
  }, [initialName])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      if (successTimer) clearTimeout(successTimer)
    }
  }, [debounceTimer, successTimer])

  // Debounced validation
  const validateName = useCallback((name: string) => {
    if (name.trim().length === 0) {
      setValidationError("Name cannot be empty")
      return false
    }
    if (name.length > MAX_NAME_LENGTH) {
      setValidationError(`Name must be ${MAX_NAME_LENGTH} characters or less`)
      return false
    }
    setValidationError(null)
    return true
  }, [])

  // Handle name change with debounced validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newName = e.target.value
    
    // Prevent exceeding max length
    if (newName.length > MAX_NAME_LENGTH) {
      newName = newName.substring(0, MAX_NAME_LENGTH)
    }

    setDisplayName(newName)

    // Clear previous debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Debounce validation
    const timer = setTimeout(() => {
      validateName(newName)
    }, DEBOUNCE_DELAY)

    setDebounceTimer(timer)
  }

  const canSubmit = !loading && displayName.trim().length > 0 && displayName !== initialName && !validationError

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!canSubmit) return
    
    // Validate before submit
    if (!validateName(displayName)) {
      return
    }
    
    setError(null)
    setSuccess(null)
    setLoading(true)
    
    try {
      const res = await fetch('/api/user/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName.trim() }),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(body?.error || 'Failed to update name')
        setLoading(false)
        return
      }

      setSuccess(body?.message || 'Name updated successfully')
      setLoading(false)
      setIsEditing(false)
      setValidationError(null)
      
      // Notify parent component of the update
      if (onNameUpdate) {
        onNameUpdate(displayName.trim())
      }

      // Refresh the page to show updated name across all components
      // The cache has been invalidated on the server via revalidateTag('user-profile')
      // This refresh will fetch fresh data with the updated name
      router.refresh()

      // Clear success message after 3 seconds
      if (successTimer) clearTimeout(successTimer)
      const timer = setTimeout(() => setSuccess(null), 3000)
      setSuccessTimer(timer)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Network error')
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setDisplayName(initialName)
    setError(null)
    setSuccess(null)
    setValidationError(null)
    
    // Clear timers
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    if (successTimer) {
      clearTimeout(successTimer)
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-3 flex flex-col items-start">
        <h3 className="font-medium">
          Display Name
        </h3>
        <div className="text-md font-bold">{displayName || 'Not set'}</div>
        <div className="">
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            className="gap-2"
            aria-label="Edit display name"
          >
            <Edit2 className="h-4 w-4" />
            Edit Name
          </Button>
        </div>
        {success && <p className="text-sm text-green-600 dark:text-green-400 mt-2">{success}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-medium">Edit Display Name</h3>
      
      <div>
        {/* <Label>Display Name</Label> */}
        <Input 
          value={displayName} 
          onChange={handleNameChange}
          placeholder="Enter your name"
          disabled={loading}
          maxLength={MAX_NAME_LENGTH}
          aria-label="Display name input"
          aria-invalid={!!validationError}
          aria-describedby={validationError ? "name-error" : undefined}
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-muted-foreground">
            {displayName.length}/{MAX_NAME_LENGTH} characters
          </p>
          {validationError && (
            <span id="name-error" className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {validationError}
            </span>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      <div className="space-x-2">
        <Button 
          type="submit" 
          disabled={!canSubmit}
          size="sm"
          className="gap-2"
          aria-busy={loading}
        >
          <Check className="h-4 w-4" />
          {loading ? 'Saving…' : 'Save Name'}
        </Button>
        <Button 
          variant="outline" 
          type="button" 
          onClick={handleCancel}
          disabled={loading}
          size="sm"
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </form>
  )
}
