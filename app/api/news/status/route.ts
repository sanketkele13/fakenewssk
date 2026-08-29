import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const result = await db.execute(sql`select count(*)::int as total, max(created_at) as last_updated from sampled_news`)
  return NextResponse.json(result.rows[0] ?? { total: 0, last_updated: null })
}
