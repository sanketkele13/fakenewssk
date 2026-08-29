import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

const topics = [
  ['politics', 'India politics government parliament elections'],
  ['business', 'India business companies startups markets economy'],
  ['economy', 'India budget inflation RBI GDP jobs economy'],
  ['sports', 'India sports cricket football athletes'],
  ['technology', 'India technology AI startups digital innovation'],
  ['health', 'India health healthcare medicine public health'],
  ['science', 'India science space research ISRO'],
  ['world', 'India world international relations diplomacy'],
  ['entertainment', 'India entertainment cinema music culture'],
]

type Item = { title: string; snippet: string; link: string; publishedAt: string | null; category: string }
const keyFor = (item: Item) => `${item.link}|${item.title}`.toLowerCase().trim()

async function fetchGoogle(category: string, query: string): Promise<Item[]> {
  const key = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX
  if (!key || !cx) return []
  const output: Item[] = []
  for (let page = 1; page <= 10; page++) {
    const start = 1 + (page - 1) * 10
    const params = new URLSearchParams({ key, cx, q: query, num: '10', start: String(start), dateRestrict: 'd30', sort: 'date' })
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    if (!response.ok) break
    const payload = await response.json() as { items?: Array<{ title?: string; snippet?: string; link?: string; pagemap?: { metatags?: Array<{ 'article:published_time'?: string }> } }> }
    const items = payload.items ?? []
    output.push(...items.flatMap((item) => item.title && item.link ? [{ title: item.title, snippet: item.snippet ?? '', link: item.link, publishedAt: item.pagemap?.metatags?.[0]?.['article:published_time'] ?? null, category }] : []))
    if (items.length < 10) break
  }
  return output
}

async function fetchRss(category: string, query: string): Promise<Item[]> {
  const response = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!response.ok) return []
  const xml = await response.text()
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap((match) => {
    const block = match[1]
    const value = (tag: string) => block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.slice(1).find(Boolean)?.trim()
    const title = value('title'); const link = value('link')
    return title && link ? [{ title, snippet: value('description') ?? '', link, publishedAt: value('pubDate') ?? null, category }] : []
  })
}

export async function syncNews(limit = 250) {
  const items: Item[] = []
  for (const [category, query] of topics) {
    const [google, rss] = await Promise.allSettled([fetchGoogle(category, query), fetchRss(category, query)])
    if (google.status === 'fulfilled') items.push(...google.value)
    if (rss.status === 'fulfilled') items.push(...rss.value)
    if (items.length >= limit) break
  }
  const unique = [...new Map(items.map((item) => [keyFor(item), item])).values()].slice(0, limit)
  let inserted = 0
  for (const item of unique) {
    const result = await db.execute(sql`insert into sampled_news (article_key, title, snippet, source_url, published_at, category) values (${keyFor(item)}, ${item.title}, ${item.snippet}, ${item.link}, ${item.publishedAt}, ${item.category}) on conflict (article_key) do nothing`)
    inserted += result.rowCount ?? 0
  }
  const count = Number((await db.execute(sql`select count(*)::int as count from sampled_news`)).rows[0]?.count ?? 0)
  return { fetched: unique.length, inserted, total: count }
}
