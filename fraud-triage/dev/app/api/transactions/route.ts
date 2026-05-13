import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const riskBucket = searchParams.get('riskBucket')
  const merchantCategory = searchParams.get('merchantCategory')

  const filter: Record<string, unknown> = {}
  if (status) filter.status = status
  if (merchantCategory) filter.merchantCategory = merchantCategory
  if (riskBucket === 'high')   filter.riskScore = { $gte: 70 }
  if (riskBucket === 'medium') filter.riskScore = { $gte: 40, $lt: 70 }
  if (riskBucket === 'low')    filter.riskScore = { $lt: 40 }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB_NAME)

  const docs = await db.collection('transactions')
    .find(filter)
    .sort({ riskScore: -1, timestamp: -1 })
    .limit(200)
    .toArray()

  const transactions = docs.map(({ _id, timestamp, ...rest }) => ({
    _id: _id.toString(),
    timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
    ...rest,
  }))

  return NextResponse.json(transactions)
}
