import { NextResponse } from 'next/server'
import { syncNews } from '@/lib/news-ingestion'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (secret && authorization !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const url = new URL(request.url)
    const requested = Number(url.searchParams.get('limit') ?? '250')
    const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.floor(requested), 1), 1000) : 250
    return NextResponse.json(await syncNews(limit))
  } catch (error) {
    console.error('[news-sync]', error)
    return NextResponse.json({ error: 'News sync failed' }, { status: 502 })
  }
}

export async function GET(request: Request) {
  return POST(request)
}
