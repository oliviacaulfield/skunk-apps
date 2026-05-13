'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Transaction = {
  _id: string
  merchant: string
  merchantCategory: string
  cardPresent: boolean
  country: string
  amount: number
  timestamp: string
  riskScore: number
  anomalyReasons: string[]
  status: string
}

type FraudCase = {
  _id: string
  transactionId: string
  caseSummary: string
  analystNotes: string
  disposition: string
  tags: string[]
  createdAt: string
}

const DISPOSITIONS = ['under_investigation', 'confirmed_fraud', 'cleared']

function riskColor(score: number) {
  if (score >= 70) return 'bg-red-100 text-red-800'
  if (score >= 40) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

function fmt(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [fraudCase, setFraudCase] = useState<FraudCase | null>(null)
  const [loading, setLoading] = useState(true)

  const [notes, setNotes] = useState('')
  const [disposition, setDisposition] = useState('under_investigation')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/transactions/${id}`)
      .then(r => r.json())
      .then(({ transaction, fraudCase }) => {
        setTransaction(transaction)
        setFraudCase(fraudCase)
        if (fraudCase) {
          setNotes(fraudCase.analystNotes ?? '')
          setDisposition(fraudCase.disposition ?? 'under_investigation')
        }
        setLoading(false)
      })
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: id, analystNotes: notes, disposition }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">Loading…</div>
  }

  if (!transaction) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">Transaction not found.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-6">
          ← Back to queue
        </Link>

        {/* Transaction card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{transaction.merchant}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{fmt(transaction.merchantCategory)}</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${riskColor(transaction.riskScore)}`}>
              Risk {transaction.riskScore}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
            <div>
              <dt className="text-gray-500">Amount</dt>
              <dd className="font-mono font-medium text-gray-900 mt-0.5">
                ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Country</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{transaction.country}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd className="mt-0.5">
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {fmt(transaction.status)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Card present</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{transaction.cardPresent ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Date</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{new Date(transaction.timestamp).toLocaleDateString()}</dd>
            </div>
          </dl>

          {transaction.anomalyReasons.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1.5">Anomaly signals</p>
              <div className="flex flex-wrap gap-1.5">
                {transaction.anomalyReasons.map(r => (
                  <span key={r} className="inline-flex px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-100">
                    {fmt(r)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Case summary (if pre-seeded) */}
        {fraudCase?.caseSummary && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">Case Summary</p>
            <p className="text-sm text-amber-900">{fraudCase.caseSummary}</p>
            {fraudCase.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {fraudCase.tags.map(t => (
                  <span key={t} className="inline-flex px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analyst notes form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Analyst Notes</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disposition</label>
              <select
                value={disposition}
                onChange={e => setDisposition(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DISPOSITIONS.map(d => <option key={d} value={d}>{fmt(d)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={5}
                placeholder="Add your analysis, findings, or next steps…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save notes'}
              </button>
              {saved && <span className="text-sm text-green-600">Saved.</span>}
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
