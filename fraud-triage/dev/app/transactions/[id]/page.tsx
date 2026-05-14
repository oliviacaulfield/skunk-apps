'use client'

import { useEffect, useRef, useState } from 'react'
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

type SimilarCase = {
  _id: string
  caseSummary: string
  disposition: string
  tags: string[]
  analystNotes: string
  score: number
}

const DISPOSITIONS = ['under_investigation', 'confirmed_fraud', 'cleared']

function dispositionColor(d: string) {
  if (d === 'confirmed_fraud') return 'bg-red-100 text-red-800'
  if (d === 'cleared') return 'bg-green-100 text-green-800'
  return 'bg-yellow-100 text-yellow-800'
}

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

  const [similarCases, setSimilarCases] = useState<SimilarCase[] | null>(null)
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [similarFilter, setSimilarFilter] = useState<string>('')
  const [fetchedFilter, setFetchedFilter] = useState<string | null>(null)
  const [similarError, setSimilarError] = useState<'rate_limited' | 'failed' | null>(null)
  const similarCacheRef = useRef<Map<string, SimilarCase[]>>(new Map())

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

  async function handleFindSimilar(filter = similarFilter) {
    if (!fraudCase?._id || loadingSimilar) return
    const cacheKey = `${fraudCase._id}:${filter}`
    if (similarCacheRef.current.has(cacheKey)) {
      setSimilarCases(similarCacheRef.current.get(cacheKey)!)
      setFetchedFilter(filter)
      setSimilarError(null)
      return
    }
    setLoadingSimilar(true)
    setSimilarError(null)
    try {
      const url = `/api/cases/${fraudCase._id}/similar${filter ? `?disposition=${filter}` : ''}`
      const res = await fetch(url)
      if (res.status === 429) {
        setSimilarError('rate_limited')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const results = data.results ?? []
      similarCacheRef.current.set(cacheKey, results)
      setSimilarCases(results)
      setFetchedFilter(filter)
    } catch {
      setSimilarError('failed')
    } finally {
      setLoadingSimilar(false)
    }
  }

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

        {/* Similar cases */}
        {fraudCase && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleFindSimilar()}
                disabled={loadingSimilar}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm"
              >
                {loadingSimilar ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Finding similar cases…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    Find similar prior cases
                  </>
                )}
              </button>
              <select
                value={similarFilter}
                onChange={e => {
                  setSimilarFilter(e.target.value)
                  if (similarCases !== null) handleFindSimilar(e.target.value)
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All dispositions</option>
                {DISPOSITIONS.map(d => <option key={d} value={d}>{fmt(d)}</option>)}
              </select>
            </div>

            {similarError && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {similarError === 'rate_limited'
                  ? 'Rate limit reached (3 req/min on free tier). Wait a moment and try again, or add a payment method in Atlas to increase limits.'
                  : 'Search failed. Check the server logs for details.'}
              </div>
            )}

            {similarCases !== null && !similarError && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {similarCases.length === 0 ? 'No similar cases found' : `${similarCases.length} similar case${similarCases.length !== 1 ? 's' : ''}`}
                </p>
                {similarCases.map(c => (
                  <div key={c._id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm text-gray-900 leading-snug">{c.caseSummary}</p>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${dispositionColor(c.disposition)}`}>
                        {fmt(c.disposition)}
                      </span>
                    </div>
                    {c.analystNotes && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{c.analystNotes}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {c.tags?.slice(0, 3).map(t => (
                          <span key={t} className="inline-flex px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{t}</span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 font-mono" title="Cosine similarity score (0–1)">
                        {c.score.toFixed(4)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
