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

const fallbackClaims = [
  {
    title: 'Reference claim: Narendra Modi is the Prime Minister of India',
    snippet: 'Narendra Modi is the current Prime Minister of India. This reference item is included for testing the classifier when external news APIs are unavailable.',
    sourceUrl: 'https://www.pmindia.gov.in/en/',
  },
  {
    title: 'Reference claim: India is a parliamentary democracy',
    snippet: 'India is a democratic republic with a parliamentary system of government. This reference item is included for classifier testing.',
    sourceUrl: 'https://www.india.gov.in/my-government/constitution-india',
  },
]

type NewsItem = { title?: string; snippet?: string; link?: string; publishedAt?: string | null }

function keyFor(url: string, title: string) {
  return `${url}|${title}`.toLowerCase().trim()
}

async function saveFirstNew(items: NewsItem[]) {
  for (const item of items) {
    if (!item.title || !item.link) continue
    const inserted = await db.execute(sql`
      INSERT INTO sampled_news (article_key, title, snippet, source_url, published_at)
      VALUES (${keyFor(item.link, item.title)}, ${item.title}, ${item.snippet ?? ''}, ${item.link}, ${item.publishedAt ?? null})
      ON CONFLICT (article_key) DO NOTHING
      RETURNING id, title, snippet, source_url, published_at
    `)
    if (inserted.rows.length > 0) {
      const row = inserted.rows[0] as { title: string; snippet: string; source_url: string; published_at: string | null }
      const count = Number((await db.execute(sql`SELECT COUNT(*)::int AS count FROM sampled_news`)).rows[0]?.count ?? 0)
      return { title: row.title, snippet: row.snippet, sourceUrl: row.source_url, publishedAt: row.published_at, storedCount: count }
    }
  }
  return null
}

async function fetchGoogleItems() {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX
  if (!apiKey || !cx) return []
  const query = queries[Math.floor(Math.random() * queries.length)]
  const params = new URLSearchParams({ key: apiKey, cx, q: query, num: '10', dateRestrict: 'd30', sort: 'date' })
  const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, { cache: 'no-store' })
  if (!response.ok) return []
  const payload = await response.json() as { items?: Array<{ title?: string; snippet?: string; link?: string; pagemap?: { metatags?: Array<{ 'article:published_time'?: string }> } }> }
  return (payload.items ?? []).map((item) => ({ title: item.title, snippet: item.snippet, link: item.link, publishedAt: item.pagemap?.metatags?.[0]?.['article:published_time'] ?? null }))
}

async function fetchRssItems() {
  const query = encodeURIComponent('Indian politics Narendra Modi parliament')
  const response = await fetch(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`, { cache: 'no-store' })
  if (!response.ok) return []
  const xml = await response.text()
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
    const block = match[1]
    const value = (tag: string) => block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.slice(1).find(Boolean)?.trim()
    return { title: value('title'), snippet: value('description'), link: value('link'), publishedAt: value('pubDate') }
  })
}

export async function GET() {
  const sources = [await fetchGoogleItems(), await fetchRssItems(), fallbackClaims.map((item) => ({ ...item, link: item.sourceUrl }))]
  for (const items of sources) {
    const saved = await saveFirstNew(items)
    if (saved) return NextResponse.json(saved)
  }
  return NextResponse.json({ error: 'No new article found. All available samples have already been used.' }, { status: 404 })
}
