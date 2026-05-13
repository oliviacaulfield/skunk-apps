import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export async function POST(req: NextRequest) {
  const { transactionId, analystNotes, disposition, caseSummary } = await req.json()
  if (!transactionId || !disposition) {
    return NextResponse.json({ error: 'transactionId and disposition are required' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB_NAME)
  const txId = new ObjectId(transactionId)

  const tx = await db.collection('transactions').findOne({ _id: txId })

  const searchableText = [
    caseSummary,
    analystNotes,
    tx?.merchant,
    tx?.merchantCategory,
    tx?.country,
    ...(tx?.anomalyReasons ?? []),
  ].filter(Boolean).join(' ')

  await db.collection('fraudCases').updateOne(
    { transactionId: txId },
    {
      $set: { analystNotes, disposition, searchableText, ...(caseSummary && { caseSummary }) },
      $setOnInsert: { transactionId: txId, createdAt: new Date(), tags: [], caseSummary: caseSummary ?? '' },
    },
    { upsert: true }
  )

  return NextResponse.json({ success: true })
}
