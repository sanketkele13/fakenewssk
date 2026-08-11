import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const queries = [
  'Indian politics parliament government election policy',
  'India political news public policy ministers parliament',
  'Indian politics governance Supreme Court parliament',
  'India election commission political parties policy',
  'Indian government budget law politics parliament',
]

function keyFor(url: string, title: string) {
  return `${url}|${title}`.toLowerCase().trim()
}

export async function GET() {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX
  if (!apiKey || !cx) return NextResponse.json({ error: 'Google Custom Search is not configured.' }, { status: 503 })

  const query = queries[Math.floor(Math.random() * queries.length)]
  const params = new URLSearchParams({ key: apiKey, cx, q: query, num: '10', dateRestrict: 'd30', sort: 'date' })
  const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, { cache: 'no-store' })
  if (!response.ok) return NextResponse.json({ error: 'Google News request failed.' }, { status: 502 })

  const payload = await response.json() as { error?: { message?: string }; items?: Array<{ title?: string; snippet?: string; link?: string; pagemap?: { metatags?: Array<{ 'article:published_time'?: string }> } }> }
  if (payload.error) return NextResponse.json({ error: `Google Custom Search: ${payload.error.message ?? 'request rejected'}` }, { status: 502 })
  const items = payload.items ?? []
  for (const item of items) {
    if (!item.title || !item.link) continue
    const articleKey = keyFor(item.link, item.title)
    const inserted = await db.execute(sql`
      INSERT INTO sampled_news (article_key, title, snippet, source_url, published_at)
      VALUES (${articleKey}, ${item.title}, ${item.snippet ?? ''}, ${item.link}, ${item.pagemap?.metatags?.[0]?.['article:published_time'] ?? null})
      ON CONFLICT (article_key) DO NOTHING
      RETURNING id, title, snippet, source_url, published_at
    `)
    if (inserted.rows.length > 0) {
      const row = inserted.rows[0] as { id: number; title: string; snippet: string; source_url: string; published_at: string | null }
      return NextResponse.json({ title: row.title, snippet: row.snippet, sourceUrl: row.source_url, publishedAt: row.published_at, storedCount: Number((await db.execute(sql`SELECT COUNT(*)::int AS count FROM sampled_news`)).rows[0]?.count ?? 0) })
    }
  }

  return NextResponse.json({ error: 'No new article found. Try Try sample again.' }, { status: 404 })
}
