import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB_NAME)
    const txId = new ObjectId(id)

    const tx = await db.collection('transactions').findOne({ _id: txId })
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const fraudCase = await db.collection('fraudCases').findOne({ transactionId: txId })

    return NextResponse.json({
      transaction: {
        ...tx,
        _id: tx._id.toString(),
        timestamp: tx.timestamp instanceof Date ? tx.timestamp.toISOString() : tx.timestamp,
      },
      fraudCase: fraudCase ? {
        ...fraudCase,
        _id: fraudCase._id.toString(),
        transactionId: fraudCase.transactionId.toString(),
        createdAt: fraudCase.createdAt instanceof Date ? fraudCase.createdAt.toISOString() : fraudCase.createdAt,
      } : null,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }
}
