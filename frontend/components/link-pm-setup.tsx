'use client'

import { useState } from 'react'

export function LinkPmSetup({
  userAddress,
  currentPmId,
  onSaved,
}: {
  userAddress: string
  currentPmId: string | null
  onSaved: (pmId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function save() {
    if (!value.startsWith('csmrpd_')) {
      setError('Must start with csmrpd_')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/users/link-pm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_address: userAddress, link_payment_method_id: value.trim() }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      onSaved(value.trim())
      setEditing(false)
      setValue('')
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setSaving(true)
    try {
      await fetch(`/api/users/link-pm?address=${userAddress}`, { method: 'DELETE' })
      onSaved('')
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (currentPmId && !editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-accent/80">
          {currentPmId.slice(0, 14)}…{currentPmId.slice(-4)}
        </span>
        <span className="text-accent text-[10px]">✓</span>
        <button
          onClick={() => setEditing(true)}
          className="font-mono text-[10px] text-dim/50 hover:text-ink transition-colors"
        >
          change
        </button>
      </div>
    )
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="font-mono text-[10px] text-accent/60 hover:text-accent transition-colors"
      >
        + register PM ID
      </button>
    )
  }

  return (
    <div className="w-full space-y-3 pt-1">
      <div className="space-y-1.5">
        <p className="font-mono text-[10px] text-dim/60 leading-relaxed">
          Run{' '}
          <code className="px-1 py-0.5 rounded bg-white/[0.06] text-ink/70">
            npx @stripe/link-cli payment-methods list
          </code>{' '}
          and paste your <code className="text-ink/70">csmrpd_…</code> PM ID below.
        </p>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="csmrpd_..."
          className="w-full bg-canvas border border-white/[0.07] rounded-lg px-3 py-2 font-mono text-xs text-ink placeholder:text-dim/30 outline-none focus:border-accent/30 transition-colors"
        />
        {error && <p className="font-mono text-[10px] text-danger/70">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving || !value}
          className="px-3 py-1.5 rounded-lg bg-accent text-canvas font-mono text-[11px] font-semibold hover:bg-accent/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {currentPmId && (
          <button
            onClick={remove}
            disabled={saving}
            className="px-3 py-1.5 font-mono text-[11px] text-danger/60 hover:text-danger transition-colors disabled:opacity-30"
          >
            Remove
          </button>
        )}
        <button
          onClick={() => { setEditing(false); setValue(''); setError(null) }}
          className="font-mono text-[10px] text-dim/50 hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
