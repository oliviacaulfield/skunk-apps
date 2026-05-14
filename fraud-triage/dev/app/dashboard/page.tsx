'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type DashboardData = {
  totalTransactions: number
  underReview: number
  avgRiskScore: number
  openCases: number
  confirmedFraud: number
  clearedCases: number
  byCategory: { category: string; count: number }[]
}

function fmt(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  const maxCount = data ? Math.max(...data.byCategory.map(c => c.count), 1) : 1

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Fraud case overview</p>
          </div>
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800">
            ← Back to queue
          </Link>
        </div>

        {!data ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            {/* Transaction queue stats */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Transaction queue</p>
              <p className="text-sm text-gray-500 mt-0.5">All transactions flagged by the monitoring system.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
              <StatCard label="Total flagged" value={data.totalTransactions} color="text-gray-900" />
              <StatCard label="Needs review" value={data.underReview} color="text-amber-600" />
              <StatCard
                label="Avg risk score"
                value={data.avgRiskScore.toFixed(1)}
                color={data.avgRiskScore >= 70 ? 'text-red-600' : data.avgRiskScore >= 40 ? 'text-amber-600' : 'text-green-600'}
              />
            </div>

            {/* Fraud case stats */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Cases opened</p>
              <p className="text-sm text-gray-500 mt-0.5">Transactions reviewed by an analyst.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
              <StatCard label="Still in progress" value={data.openCases} color="text-amber-600" />
              <StatCard label="Confirmed fraud" value={data.confirmedFraud} color="text-red-600" />
              <StatCard label="Cleared" value={data.clearedCases} color="text-green-600" />
            </div>

            {/* By category */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Fraud cases by merchant category</h2>
              <div className="space-y-3">
                {data.byCategory.map(({ category, count }) => (
                  <div key={category} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-sm text-gray-600">{fmt(category)}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
