import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB_NAME)

  const [
    totalTransactions,
    underReview,
    txAvgRiskResult,
    openCases,
    confirmedFraud,
    clearedCases,
    byCategory,
  ] = await Promise.all([
    db.collection('transactions').countDocuments(),
    db.collection('transactions').countDocuments({ status: { $in: ['pending', 'under_review'] } }),
    db.collection('transactions').aggregate([
      { $group: { _id: null, avg: { $avg: '$riskScore' } } },
    ]).toArray(),
    db.collection('fraudCases').countDocuments({ disposition: 'under_investigation' }),
    db.collection('fraudCases').countDocuments({ disposition: 'confirmed_fraud' }),
    db.collection('fraudCases').countDocuments({ disposition: 'cleared' }),
    db.collection('fraudCases').aggregate([
      {
        $lookup: {
          from: 'transactions',
          localField: 'transactionId',
          foreignField: '_id',
          as: 'tx',
        },
      },
      { $unwind: '$tx' },
      { $group: { _id: '$tx.merchantCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray(),
  ])

  return NextResponse.json({
    totalTransactions,
    underReview,
    avgRiskScore: txAvgRiskResult[0]?.avg ?? 0,
    openCases,
    confirmedFraud,
    clearedCases,
    byCategory: byCategory.map(r => ({ category: r._id as string, count: r.count as number })),
  })
}
