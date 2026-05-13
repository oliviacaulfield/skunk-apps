import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI!

if (!uri) throw new Error('MONGODB_URI is not set in .env.local')

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const client = new MongoClient(uri)

const clientPromise: Promise<MongoClient> =
  process.env.NODE_ENV === 'development'
    ? (global._mongoClientPromise ??= client.connect())
    : client.connect()

export default clientPromise
