'use client'

import { useState, useEffect } from 'react'

const METHOD_TYPES = ['Zelle', 'Venmo', 'CashApp', 'Bank Transfer', 'Wire', 'PayPal', 'Other'] as const

type PaymentMethod = { type: string; label: string; value: string }

interface Props {
  userAddress: string
  initialMethods: PaymentMethod[]
  onSaved: (methods: PaymentMethod[]) => void
}

export function PaymentMethodsEditor({ userAddress, initialMethods, onSaved }: Props) {
  const [methods,  setMethods]  = useState<PaymentMethod[]>(initialMethods)
  const [adding,   setAdding]   = useState(false)

  // Sync when parent async-loads the saved methods (useState only uses the initial value once)
  useEffect(() => {
    if (!adding) setMethods(initialMethods)
  }, [initialMethods]) // eslint-disable-line react-hooks/exhaustive-deps
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [newType,  setNewType]  = useState('Zelle')
  const [newLabel, setNewLabel] = useState('')
  const [newValue, setNewValue] = useState('')

  function addMethod() {
    if (!newValue.trim()) { setError('Enter the account/number'); return }
    const updated: PaymentMethod[] = [
      ...methods,
      { type: newType, label: newLabel.trim() || newType, value: newValue.trim() },
    ]
    setMethods(updated)
    setNewType('Zelle')
    setNewLabel('')
    setNewValue('')
    setAdding(false)
    setError(null)
    void save(updated)
  }

  function removeMethod(i: number) {
    const updated = methods.filter((_, idx) => idx !== i)
    setMethods(updated)
    void save(updated)
  }

  async function save(updated: PaymentMethod[]) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/users/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress, payment_methods: updated }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      onSaved(updated)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 w-full">

      {/* Existing methods */}
      {methods.length > 0 && (
        <div className="space-y-1.5">
          {methods.map((pm, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-canvas/40 rounded-lg border border-white/[0.05]"
            >
              <div className="min-w-0">
                <span className="font-mono text-[10px] text-dim/60 uppercase tracking-widest mr-2">
                  {pm.type}
                </span>
                <span className="font-mono text-xs text-ink/80 truncate">{pm.value}</span>
                {pm.label !== pm.type && pm.label !== pm.value && (
                  <span className="font-mono text-[10px] text-dim/40 ml-1.5">({pm.label})</span>
                )}
              </div>
              <button
                onClick={() => removeMethod(i)}
                className="font-mono text-[10px] text-dim/40 hover:text-danger/70 transition-colors shrink-0"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      )}

      {methods.length === 0 && !adding && (
        <p className="font-mono text-[10px] text-dim/40">No payment methods added yet</p>
      )}

      {/* Add form */}
      {adding ? (
        <div className="space-y-2.5 p-3 bg-canvas/40 rounded-lg border border-white/[0.07]">
          <div className="flex flex-wrap gap-1">
            {METHOD_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest border transition-colors ${
                  newType === t
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-white/[0.06] text-dim/50 hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={newType === 'Bank Transfer' ? 'Account number or IBAN' : `Your ${newType} handle or number`}
            className="w-full bg-canvas border border-white/[0.07] rounded-lg px-3 py-2 font-mono text-xs text-ink placeholder:text-dim/30 outline-none focus:border-accent/30 transition-colors"
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (optional, e.g. Personal)"
            className="w-full bg-canvas border border-white/[0.07] rounded-lg px-3 py-2 font-mono text-xs text-ink placeholder:text-dim/30 outline-none focus:border-accent/30 transition-colors"
          />
          {error && <p className="font-mono text-[10px] text-danger/70">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={addMethod}
              disabled={saving}
              className="flex-1 py-1.5 rounded-lg bg-accent text-canvas font-mono text-[10px] font-semibold hover:bg-accent/80 transition-colors disabled:opacity-30"
            >
              {saving ? 'saving…' : 'Add'}
            </button>
            <button
              onClick={() => { setAdding(false); setError(null) }}
              className="px-3 py-1.5 rounded-lg border border-white/[0.07] font-mono text-[10px] text-dim hover:text-ink transition-colors"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="font-mono text-[10px] text-accent/60 hover:text-accent transition-colors"
        >
          + add method
        </button>
      )}

      {saving && !adding && (
        <p className="font-mono text-[10px] text-dim/40">saving…</p>
      )}
    </div>
  )
}
