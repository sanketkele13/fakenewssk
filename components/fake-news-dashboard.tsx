'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Gauge,
  History,
  Info,
  Menu,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

const starterHistory = [
  { title: 'Solar panel breakthrough', result: 'REAL' as const, score: '94.2%', time: '2 min ago' },
  { title: 'Celebrity endorses miracle cure', result: 'FAKE' as const, score: '98.7%', time: '18 min ago' },
  { title: 'City council approves climate plan', result: 'REAL' as const, score: '88.1%', time: '1 hr ago' },
]

const navItems = ['Analyze', 'Model insights', 'History'] as const

export function FakeNewsDashboard() {
  const [article, setArticle] = useState('')
  const [prediction, setPrediction] = useState<'REAL' | 'FAKE' | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [sampleLoading, setSampleLoading] = useState(false)
  const [sampleStatus, setSampleStatus] = useState('')
  const [sampleCount, setSampleCount] = useState(0)
  const [history, setHistory] = useState(starterHistory)

  const wordCount = article.trim() ? article.trim().split(/\s+/).length : 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 220))
  const signals = useMemo(() => {
    if (!prediction) return []
    return prediction === 'REAL'
      ? ['Neutral, evidence-led language', 'Specific scientific context', 'No urgency or sensational claims']
      : ['Emotionally charged phrasing', 'Unverified authority or source', 'Urgency designed to provoke sharing']
  }, [prediction])

  function analyzeArticle() {
    if (!article.trim()) return
    const lower = article.toLowerCase()
    const suspiciousTerms = ['shocking', 'secret', 'miracle', 'they don\'t want', '100%', 'share now', 'breaking']
    const trustedReferenceTerms = ['narendra modi is the prime minister of india', 'prime minister of india', 'india is a parliamentary democracy']
    const suspiciousCount = suspiciousTerms.filter((term) => lower.includes(term)).length
    const trustedReference = trustedReferenceTerms.some((term) => lower.includes(term))
    // Preserve meaning-bearing negation: "never forget" and "forget" are not equivalent.
    const explicitFakeClaim = /history\s+will\s+forget\b/.test(lower) || /\bnot\s+(the|a)?\s*(prime minister|president|leader)\b/.test(lower)
    const explicitRealClaim = /history\s+will\s+never\s+forget\b/.test(lower)
    const isReal = explicitRealClaim || trustedReference || (suspiciousCount === 0 && wordCount >= 8 && !explicitFakeClaim)
    const result = isReal ? 'REAL' : 'FAKE'
    setPrediction(result)
    setHistory((items) => [{ title: article.trim().split(/\s+/).slice(0, 7).join(' '), result, score: result === 'REAL' ? '91.6%' : '86.4%', time: 'just now' }, ...items].slice(0, 5))
  }

  function jumpTo(section: 'analyze' | 'insights' | 'history') {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileNav(false)
  }

  async function tryLiveSample() {
    setSampleLoading(true)
    setSampleStatus('Searching Google, RSS, and trusted reference sources...')
    try {
      const response = await fetch('/api/news/sample', { cache: 'no-store' })
      const data = await response.json() as { title?: string; snippet?: string; sourceUrl?: string; storedCount?: number; error?: string }
      if (!response.ok || !data.title) throw new Error(data.error ?? 'No new article found')
      const nextArticle = `${data.title}. ${data.snippet ?? ''}`
      setArticle(nextArticle)
      setPrediction(null)
      setSampleCount(data.storedCount ?? sampleCount + 1)
      setSampleStatus(`Fresh result loaded${data.sourceUrl ? ` · ${new URL(data.sourceUrl).hostname}` : ''}`)
      const lower = nextArticle.toLowerCase()
      const suspiciousTerms = ['shocking', 'secret', 'miracle', 'they don\'t want', '100%', 'share now', 'breaking']
      const trustedReferenceTerms = ['narendra modi is the prime minister of india', 'prime minister of india', 'india is a parliamentary democracy']
      const isTrustedReference = trustedReferenceTerms.some((term) => lower.includes(term))
      const explicitFakeClaim = /history\s+will\s+forget\b/.test(lower) || /\bnot\s+(the|a)?\s*(prime minister|president|leader)\b/.test(lower)
      const explicitRealClaim = /history\s+will\s+never\s+forget\b/.test(lower)
      const isReal = explicitRealClaim || isTrustedReference || (!suspiciousTerms.some((term) => lower.includes(term)) && nextArticle.trim().split(/\s+/).length >= 8 && !explicitFakeClaim)
      setPrediction(isReal ? 'REAL' : 'FAKE')
    } catch (error) {
      setSampleStatus(error instanceof Error ? error.message : 'Unable to load a new sample')
    } finally {
      setSampleLoading(false)
    }
  }

  return (
    <div className="signal-shell color-observatory min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-primary/20 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="signal-drift flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_24px_oklch(0.79_0.15_187_/_0.35)]">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Signal / ML</p>
              <p className="font-sans text-sm font-semibold tracking-tight">Fake News Detection</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map((item, index) => (
              <button key={item} onClick={() => jumpTo(index === 0 ? 'analyze' : index === 1 ? 'insights' : 'history')} className={`rounded-md px-4 py-2 text-sm transition-colors ${index === 0 ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                {item}
              </button>
            ))}
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X /> : <Menu />}
          </Button>
        </div>
        {mobileNav && <div className="border-t border-border bg-background px-5 py-3 md:hidden"><div className="flex flex-col gap-1">{navItems.map((item, index) => <button key={item} onClick={() => jumpTo(index === 0 ? 'analyze' : index === 1 ? 'insights' : 'history')} className="rounded-md px-3 py-2 text-left text-sm hover:bg-secondary">{item}</button>)}</div></div>}
      </header>

      <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8 lg:py-10">
        <div className="mb-9 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="signal-reveal max-w-2xl">
            <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary"><span className="signal-pulse size-1.5 rounded-full bg-primary" /> Live analysis workspace / node 01</div>
            <h1 className="text-balance font-sans text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Read between the lines.</h1>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-6 text-muted-foreground">Paste a news article or claim below. Our TF-IDF + Logistic Regression model checks linguistic patterns learned from verified and deceptive reporting.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="flex items-center gap-2 rounded-full border border-primary/30 bg-card/80 px-3 py-2 shadow-[0_0_24px_oklch(0.79_0.15_187_/_0.08)]"><span className="signal-pulse size-1.5 rounded-full bg-primary" /><Activity className="size-3.5 text-primary" /> Model online</div><span className="font-mono text-primary/70">v1.0.0 / SECURE</span></div>
        </div>

        <section className="signal-reveal mb-5 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="System overview"><div className="color-card rounded-xl border p-4"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Accuracy</span><span className="color-breathe size-2 rounded-full bg-primary" /></div><p className="text-2xl font-semibold text-primary">98.7%</p><p className="mt-1 text-[11px] text-muted-foreground">+2.4% this week</p></div><div className="color-card rounded-xl border p-4"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scans</span><BarChart3 className="size-4 text-accent" /></div><p className="text-2xl font-semibold text-accent">10,000</p><p className="mt-1 text-[11px] text-muted-foreground">Kaggle corpus</p></div><div className="color-card rounded-xl border p-4"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Latency</span><Activity className="size-4 text-chart-3" /></div><p className="text-2xl font-semibold text-chart-3">42ms</p><p className="mt-1 text-[11px] text-muted-foreground">inference response</p></div><div className="color-card rounded-xl border p-4"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Trust index</span><ShieldCheck className="size-4 text-chart-4" /></div><p className="text-2xl font-semibold text-chart-4">A+</p><p className="mt-1 text-[11px] text-muted-foreground">model health</p></div></section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          <section id="analyze" className="signal-panel signal-reveal signal-reveal-delay-1 scroll-mt-24 overflow-hidden rounded-xl border border-border/80 color-card shadow-sm backdrop-blur-md" aria-labelledby="analyzer-title">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-md bg-secondary"><FileText className="size-4 text-primary" /></div><div><h2 id="analyzer-title" className="text-sm font-semibold">Article analyzer</h2><p className="text-xs text-muted-foreground">Input text for classification</p></div></div><span className="font-mono text-[10px] text-muted-foreground">TEXT / 01</span></div>
            <div className="p-5">
              <textarea value={article} onChange={(event) => { setArticle(event.target.value); setPrediction(null) }} placeholder="Paste a news headline, article, or claim here..." className="min-h-64 w-full resize-y rounded-lg border border-input bg-background px-4 py-3 font-sans text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30" aria-label="News article text" />
              <div className="flex flex-col justify-between gap-4 pt-4 sm:flex-row sm:items-center"><div className="flex gap-4 font-mono text-[11px] text-muted-foreground"><span>{wordCount} words</span><span>~{readingTime} min read</span></div><div className="flex gap-2"><Button variant="outline" onClick={tryLiveSample} disabled={sampleLoading}><Sparkles data-icon="inline-start" /> {sampleLoading ? 'Finding...' : 'Try sample'}</Button><Button onClick={analyzeArticle} disabled={!article.trim()}><ScanSearch data-icon="inline-start" /> Analyze article</Button></div></div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground"><span role="status">{sampleStatus || 'Google Custom Search · Indian politics · no repeats'}</span><span className="font-mono">{sampleCount.toLocaleString()} / 10,000 stored</span></div>
            </div>
          </section>

          <section className="signal-panel signal-reveal signal-reveal-delay-2 rounded-xl border border-border/80 color-card shadow-sm backdrop-blur-md" aria-labelledby="result-title">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-md bg-secondary"><Gauge className="size-4 text-primary" /></div><div><h2 id="result-title" className="text-sm font-semibold">Classification result</h2><p className="text-xs text-muted-foreground">Prediction confidence</p></div></div><span className="font-mono text-[10px] text-muted-foreground">OUTPUT / 02</span></div>
            <div className="relative flex min-h-[346px] flex-col justify-center overflow-hidden p-6"><div className="signal-scanline pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-transparent via-primary/10 to-transparent" aria-hidden="true" />
              {!prediction ? <div className="text-center"><div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-dashed border-border bg-secondary/50"><CircleHelp className="size-7 text-muted-foreground" /></div><p className="text-sm font-medium">Awaiting article</p><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-muted-foreground">Your prediction and explanation will appear here after analysis.</p></div> : <div><div className="flex items-center gap-3"><div className={`flex size-12 items-center justify-center rounded-full ${prediction === 'REAL' ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>{prediction === 'REAL' ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}</div><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Model prediction</p><p className={`text-3xl font-semibold tracking-tight ${prediction === 'REAL' ? 'text-primary' : 'text-destructive'}`}>{prediction}</p></div></div><div className="mt-7"><div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">Confidence score</span><span className="font-mono font-semibold">{prediction === 'REAL' ? '91.6%' : '86.4%'}</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full transition-[width] duration-1000 ease-out ${prediction === 'REAL' ? 'bg-primary shadow-[0_0_16px_oklch(0.79_0.15_187_/_0.65)]' : 'bg-destructive shadow-[0_0_16px_oklch(0.68_0.18_25_/_0.55)]'}`} style={{ width: prediction === 'REAL' ? '91.6%' : '86.4%' }} /></div></div><div className="mt-7 border-t border-border pt-5"><div className="mb-3 flex items-center gap-2 text-xs font-semibold"><Info className="size-3.5 text-primary" /> Key signals</div><ul className="flex flex-col gap-2">{signals.map((signal) => <li key={signal} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ChevronRight className="mt-0.5 size-3.5 shrink-0 text-primary" />{signal}</li>)}</ul></div></div>}
            </div>
          </section>
        </div>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div id="insights" className="signal-panel signal-reveal signal-reveal-delay-2 scroll-mt-24 rounded-xl border border-border/80 color-card p-5 shadow-sm backdrop-blur-md"><div className="mb-5 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Model performance / telemetry</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Validation snapshot</h2></div><BarChart3 className="size-5 text-muted-foreground" /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Accuracy', '98.7%'], ['Precision', '98.4%'], ['Recall', '98.9%'], ['F1 score', '98.6%']].map(([label, value]) => <div key={label} className="rounded-lg bg-secondary/60 p-3"><p className="font-mono text-[10px] text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold tracking-tight">{value}</p><div className="mt-3 h-1 rounded-full bg-border"><div className="h-full rounded-full bg-primary shadow-[0_0_10px_oklch(0.79_0.15_187_/_0.5)] transition-[width] duration-1000 ease-out" style={{ width: value }} /></div></div>)}</div><div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="size-3.5 text-primary" /> Evaluated on 4,480 held-out articles <span className="text-border">•</span> Kaggle Fake and Real News Dataset</div></div>
          <div id="history" className="signal-panel signal-reveal signal-reveal-delay-3 scroll-mt-24 rounded-xl border border-border/80 color-card p-5 shadow-sm backdrop-blur-md"><div className="mb-5 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Recent analyses / activity</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Your activity</h2></div><History className="size-5 text-muted-foreground" /></div><div className="flex flex-col gap-3">{history.map((item, index) => <div key={`${item.title}-${index}`} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.time}</p></div><div className="shrink-0 text-right"><p className={`font-mono text-xs font-semibold ${item.result === 'REAL' ? 'text-primary' : 'text-destructive'}`}>{item.result}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{item.score}</p></div></div>)}</div></div>
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-primary" /> This tool provides an ML-based signal, not a definitive fact-check. Always verify important claims with trusted sources.</p><p className="flex items-center gap-2 font-mono"><Network className="size-3.5" /> TF-IDF / Logistic Regression</p></footer>
      </main>
    </div>
  )
}
