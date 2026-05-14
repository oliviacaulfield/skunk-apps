'use client'

import { useEffect, useState } from 'react'
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

const STATUSES = ['pending', 'under_review', 'cleared', 'confirmed_fraud']
const CATEGORIES = [
  'electronics', 'gaming', 'gas_station', 'grocery',
  'online_retail', 'restaurant', 'retail', 'rideshare',
  'subscription', 'travel',
]

function riskBadge(score: number) {
  if (score >= 70) return 'bg-red-100 text-red-800'
  if (score >= 40) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

function statusBadge(status: string) {
  switch (status) {
    case 'under_review':    return 'bg-orange-100 text-orange-800'
    case 'confirmed_fraud': return 'bg-red-100 text-red-800'
    case 'cleared':         return 'bg-green-100 text-green-800'
    default:                return 'bg-blue-100 text-blue-800'
  }
}

function fmt(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function QueuePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [riskBucket, setRiskBucket] = useState('')
  const [merchantCategory, setMerchantCategory] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (riskBucket) params.set('riskBucket', riskBucket)
    if (merchantCategory) params.set('merchantCategory', merchantCategory)

    fetch(`/api/transactions?${params}`)
      .then(r => r.json())
      .then(data => { setTransactions(data); setLoading(false) })
  }, [status, riskBucket, merchantCategory])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fraud Triage Queue</h1>
            <p className="text-sm text-gray-500 mt-1">Review flagged transactions and open fraud cases</p>
          </div>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-800">
            Dashboard →
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
          </select>

          <select
            value={riskBucket}
            onChange={e => setRiskBucket(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All risk levels</option>
            <option value="high">High (70+)</option>
            <option value="medium">Medium (40–69)</option>
            <option value="low">Low (&lt;40)</option>
          </select>

          <select
            value={merchantCategory}
            onChange={e => setMerchantCategory(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{fmt(c)}</option>)}
          </select>

          {(status || riskBucket || merchantCategory) && (
            <button
              onClick={() => { setStatus(''); setRiskBucket(''); setMerchantCategory('') }}
              className="text-sm text-gray-500 hover:text-gray-700 underline self-center"
            >
              Clear filters
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-3">
          {loading ? 'Loading…' : `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`}
        </p>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Risk', 'Merchant', 'Category', 'Amount', 'Country', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    No transactions match the current filters.
                  </td>
                </tr>
              )}
              {transactions.map(tx => (
                <tr key={tx._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${riskBadge(tx.riskScore)}`}>
                      {tx.riskScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <Link href={`/transactions/${tx._id}`} className="hover:text-indigo-600">
                      {tx.merchant}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{fmt(tx.merchantCategory)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                    ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{tx.country}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(tx.status)}`}>
                      {fmt(tx.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
