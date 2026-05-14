import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const dispositionFilter = req.nextUrl.searchParams.get('disposition')

  let caseId: ObjectId
  try {
    caseId = new ObjectId(id)
  } catch {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB_NAME)

  const currentCase = await db.collection('fraudCases').findOne(
    { _id: caseId },
    { projection: { searchableText: 1 } }
  )

  if (!currentCase?.searchableText) {
    return NextResponse.json({ results: [] })
  }

  const vectorSearchStage: Record<string, unknown> = {
    index: 'autoembed_index',
    path: 'searchableText',
    query: currentCase.searchableText,
    numCandidates: 50,
    limit: 10,
  }

  if (dispositionFilter) {
    vectorSearchStage.filter = { disposition: { $eq: dispositionFilter } }
  }

  try {
    const results = await db.collection('fraudCases').aggregate([
      { $vectorSearch: vectorSearchStage },
      { $match: { _id: { $ne: caseId } } },
      { $limit: 5 },
      {
        $project: {
          caseSummary: 1,
          disposition: 1,
          tags: 1,
          analystNotes: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]).toArray()

    return NextResponse.json({
      results: results.map(r => ({
        ...r,
        _id: r._id.toString(),
      })),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('429') || msg.includes('RateLimit') || msg.includes('Rate limit')) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
    console.error('[similar] $vectorSearch failed:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
