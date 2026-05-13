import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    await client.db('admin').command({ ping: 1 })
    return NextResponse.json({ status: 'ok', connected: true })
  } catch (e) {
    return NextResponse.json({ status: 'error', connected: false }, { status: 500 })
  }
}
