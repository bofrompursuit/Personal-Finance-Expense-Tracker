import { useState, useCallback, useRef, useMemo } from "react"
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  isAmbiguous?: boolean
}

const CATEGORIES = [
  "Groceries", "Transport", "Subscriptions", "Dining",
  "Shopping", "Entertainment", "Utilities", "Health", "Other",
]

const CAT_COLORS: Record<string, string> = {
  Groceries: "#a3b18a",
  Transport: "#6b9ac4",
  Subscriptions: "#9b72cf",
  Dining: "#e0a96d",
  Shopping: "#e07d9b",
  Entertainment: "#5ec4c4",
  Utilities: "#7fa8a0",
  Health: "#d4a5a5",
  Other: "#71717a",
}

const ACCENT = "#e0ccbb"

const KEYWORD_MAP: Record<string, string[]> = {
  Groceries: ["whole foods", "trader joe", "kroger", "safeway", "aldi", "costco", "walmart", "grocery", "sprouts", "publix", "market"],
  Transport: ["uber", "lyft", "metro", "transit", "shell", "chevron", "exxon", "parking", "taxi", "mta", "caltrain", "gas station", "bp"],
  Subscriptions: ["netflix", "spotify", "hulu", "apple", "google one", "microsoft", "subscription", "adobe", "dropbox", "notion", "youtube", "prime"],
  Dining: ["restaurant", "mcdonald", "starbucks", "chipotle", "doordash", "grubhub", "seamless", "pizza", "cafe", "sushi", "taco", "burger", "grill", "bistro"],
  Shopping: ["amazon", "ebay", "etsy", "zara", "h&m", "gap", "nordstrom", "macy", "asos", "shein", "uniqlo", "bestbuy"],
  Entertainment: ["cinema", "movie", "theatre", "concert", "ticketmaster", "steam", "gaming", "playstation", "xbox", "fandango"],
  Utilities: ["electric", "water bill", "internet", "phone bill", "at&t", "verizon", "comcast", "xfinity", "pge", "utility"],
  Health: ["pharmacy", "cvs", "walgreens", "doctor", "hospital", "gym", "fitness", "health", "dental", "medical", "rite aid"],
}

function categorize(desc: string): { category: string; isAmbiguous: boolean } {
  const lower = desc.toLowerCase()
  for (const [cat, kws] of Object.entries(KEYWORD_MAP)) {
    if (kws.some(kw => lower.includes(kw))) return { category: cat, isAmbiguous: false }
  }
  return { category: "Other", isAmbiguous: true }
}

function parseCSV(text: string): Transaction[] {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []
  const first = lines[0].toLowerCase()
  const dataLines = first.includes("date") || first.includes("desc") || first.includes("amount")
    ? lines.slice(1)
    : lines
  return dataLines.map((line, i) => {
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""))
    const date = cols[0] || ""
    const description = cols[1] || ""
    let amount = 0
    for (let j = 2; j < cols.length; j++) {
      const v = parseFloat(cols[j].replace(/[$,]/g, ""))
      if (!isNaN(v) && v !== 0) { amount = Math.abs(v); break }
    }
    const { category, isAmbiguous } = categorize(description)
    return { id: `t-${i}`, date, description, amount, category, isAmbiguous }
  }).filter(t => t.amount > 0)
}

const SAMPLE: Transaction[] = [
  { id: "1", date: "2026-08-30", description: "Whole Foods Market", amount: 84.32, category: "Groceries" },
  { id: "2", date: "2026-08-29", description: "Uber Trip", amount: 18.50, category: "Transport" },
  { id: "3", date: "2026-08-28", description: "Netflix Monthly", amount: 15.49, category: "Subscriptions" },
  { id: "4", date: "2026-08-27", description: "Chipotle", amount: 14.75, category: "Dining" },
  { id: "5", date: "2026-08-26", description: "Amazon Order #12-881", amount: 67.22, category: "Shopping" },
  { id: "6", date: "2026-08-25", description: "Fandango Movie Tickets", amount: 32.00, category: "Entertainment" },
  { id: "7", date: "2026-08-24", description: "Starbucks Reserve", amount: 7.45, category: "Dining" },
  { id: "8", date: "2026-08-23", description: "Spotify Premium", amount: 9.99, category: "Subscriptions" },
  { id: "9", date: "2026-08-22", description: "CVS Pharmacy", amount: 23.60, category: "Health" },
  { id: "10", date: "2026-08-21", description: "Trader Joe's", amount: 55.80, category: "Groceries" },
  { id: "11", date: "2026-08-20", description: "Shell Gas Station", amount: 48.15, category: "Transport" },
  { id: "12", date: "2026-08-19", description: "Comcast Internet", amount: 79.99, category: "Utilities" },
  { id: "13", date: "2026-08-18", description: "Zara Purchase", amount: 89.00, category: "Shopping" },
  { id: "14", date: "2026-08-17", description: "Chez Margot Bistro", amount: 42.80, category: "Dining" },
  { id: "15", date: "2026-08-16", description: "Wire Transfer — Ref 9941", amount: 150.00, category: "Other", isAmbiguous: true },
  { id: "16", date: "2026-08-15", description: "Adobe Creative Cloud", amount: 54.99, category: "Subscriptions" },
  { id: "17", date: "2026-08-14", description: "Lyft Ride", amount: 22.30, category: "Transport" },
  { id: "18", date: "2026-08-13", description: "Whole Foods Market", amount: 91.40, category: "Groceries" },
  { id: "19", date: "2026-08-12", description: "Fitness First Membership", amount: 40.00, category: "Health" },
  { id: "20", date: "2026-08-11", description: "Steam Summer Sale", amount: 29.99, category: "Entertainment" },
]

const MONTHLY = [
  { month: "Mar", total: 1420 },
  { month: "Apr", total: 1855 },
  { month: "May", total: 1320 },
  { month: "Jun", total: 2140 },
  { month: "Jul", total: 1690 },
  { month: "Aug", total: 1977 },
]

const TOOLTIP_STYLE = {
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 10,
  fontSize: 12,
  color: "#e4e4e7",
}

export default function App() {
  const [view, setView] = useState<"upload" | "dashboard">("upload")
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE)
  const [isDragging, setIsDragging] = useState(false)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("All")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const parsed = parseCSV(e.target?.result as string)
      if (parsed.length > 0) { setTransactions(parsed); setView("dashboard") }
    }
    reader.readAsText(file)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith(".csv")) handleFile(file)
  }, [handleFile])

  const catTotals = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const totalSpend = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions])

  const filtered = useMemo(() =>
    transactions.filter(t =>
      t.description.toLowerCase().includes(search.toLowerCase()) &&
      (catFilter === "All" || t.category === catFilter)
    ), [transactions, search, catFilter])

  const updateCat = (id: string, category: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, category, isAmbiguous: false } : t))
    setEditingId(null)
  }

  const navTo = (label: string) => {
    if (label === "Upload") setView("upload")
    else setView("dashboard")
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5" style={{ mixBlendMode: "difference" }}>
        <button onClick={() => setView("upload")} className="text-white text-sm uppercase tracking-[0.22em]">
          Ledger
        </button>
        <div className="hidden md:flex items-center gap-10">
          {["Dashboard", "Upload", "History"].map(l => (
            <button key={l} onClick={() => navTo(l)}
              className="text-white text-[11px] uppercase tracking-[0.18em] transition-opacity duration-300 hover:opacity-40">
              {l}
            </button>
          ))}
        </div>
        <button className="md:hidden text-white flex flex-col gap-[5px]" onClick={() => setMenuOpen(o => !o)}>
          <span className={`block w-5 h-px bg-white origin-center transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[6px]" : ""}`} />
          <span className={`block w-5 h-px bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-px bg-white origin-center transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[6px]" : ""}`} />
        </button>
      </nav>

      {/* ── Mobile Overlay ── */}
      <div className={`fixed inset-0 z-40 bg-zinc-950 flex flex-col items-center justify-center gap-10 transition-all duration-500 ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {["Dashboard", "Upload", "History"].map(l => (
          <button key={l} onClick={() => navTo(l)}
            className="text-white text-3xl uppercase tracking-[0.3em] font-light">
            {l}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════ UPLOAD VIEW ═══ */}
      {view === "upload" && (
        <section className="min-h-screen flex flex-col justify-between px-6 md:px-12 pt-28 pb-16">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-600 mb-8">Personal Finance</p>
            <h1 className="text-[13vw] md:text-[9vw] font-light tracking-[-0.04em] leading-[0.88] text-white select-none">
              Track<br />every<br />dollar.
            </h1>
          </div>

          <div className="max-w-lg mt-16">
            <p className="text-zinc-500 text-sm leading-relaxed mb-10" style={{ fontWeight: 300 }}>
              Upload your bank export and Ledger automatically categorizes your spending,
              surfaces insights, and tracks trends over time — entirely in your browser.
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative border rounded-2xl p-14 cursor-pointer flex flex-col items-center gap-5 text-center transition-all duration-500
                ${isDragging ? "border-[#e0ccbb] bg-zinc-900/80" : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40"}`}
            >
              <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-500
                ${isDragging ? "border-[#e0ccbb] scale-110" : "border-zinc-800"}`}>
                <svg className={`w-5 h-5 transition-colors duration-500 ${isDragging ? "text-[#e0ccbb]" : "text-zinc-600"}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div>
                <p className="text-zinc-300 text-sm" style={{ fontWeight: 300 }}>Drop your CSV here</p>
                <p className="text-zinc-600 text-xs mt-1">or click to browse — .csv files only</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>

            {/* CTA */}
            <button
              onClick={() => setView("dashboard")}
              className="group mt-8 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              <span className="relative">
                View sample dashboard
                <span className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-500 ease-out" style={{ background: ACCENT }} />
              </span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          <div className="flex items-end justify-between mt-20">
            <p className="text-zinc-700 text-[10px] tracking-widest uppercase max-w-xs leading-relaxed">
              All processing is client-side — your data never leaves this browser.
            </p>
            <p className="text-zinc-800 text-[10px]">v1.0</p>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════ DASHBOARD VIEW ═══ */}
      {view === "dashboard" && (
        <section className="pt-24 pb-24 px-6 md:px-12">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-600 mb-3">August 2026</p>
              <h2 className="text-6xl md:text-8xl font-light tracking-[-0.04em] text-white leading-none">
                ${totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-zinc-600 text-xs uppercase tracking-widest mt-3">total spend this period</p>
            </div>
            <div className="flex items-center gap-8">
              <div>
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-1">Transactions</p>
                <p className="text-white text-3xl font-light">{transactions.length}</p>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div>
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-1">Categories</p>
                <p className="text-white text-3xl font-light">{catTotals.length}</p>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div>
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-1">Avg. Spend</p>
                <p className="text-white text-3xl font-light">${(totalSpend / transactions.length).toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">

            {/* Donut */}
            <div className="bg-zinc-900 rounded-3xl p-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600 mb-8">Spend by Category</p>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={catTotals} cx="50%" cy="50%" innerRadius={55} outerRadius={82}
                        paddingAngle={2} dataKey="value" strokeWidth={0}>
                        {catTotals.map(e => (
                          <Cell key={e.name} fill={CAT_COLORS[e.name] || "#71717a"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toFixed(2)}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 flex-1 w-full">
                  {catTotals.slice(0, 7).map(({ name, value }) => (
                    <div key={name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[name] || "#71717a" }} />
                        <span className="text-zinc-400 text-xs truncate">{name}</span>
                      </div>
                      <span className="text-zinc-300 text-xs flex-shrink-0">${value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Line */}
            <div className="bg-zinc-900 rounded-3xl p-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600 mb-8">Monthly Trend</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={MONTHLY} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#52525b", fontSize: 11, fontFamily: "Inter" }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#52525b", fontSize: 11, fontFamily: "Inter" }}
                    axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`$${v}`, "Spend"]} />
                  <Line type="monotone" dataKey="total" stroke={ACCENT} strokeWidth={1.5}
                    dot={{ fill: ACCENT, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: ACCENT }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-zinc-900 rounded-3xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
                Transactions <span className="text-zinc-700 ml-2">{filtered.length}</span>
              </p>
              <div className="flex gap-3 flex-wrap">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="bg-zinc-800 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 outline-none focus:border-zinc-700 w-40 transition-colors duration-200" />
                </div>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  className="bg-zinc-800 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 outline-none focus:border-zinc-700 cursor-pointer">
                  <option>All</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="grid gap-x-6 pb-3 border-b border-zinc-800 text-[10px] uppercase tracking-[0.18em] text-zinc-700"
                style={{ gridTemplateColumns: "140px 1fr auto auto" }}>
                <span>Date</span><span>Description</span><span>Category</span>
                <span className="text-right">Amount</span>
              </div>
              {filtered.map(t => (
                <div key={t.id}
                  className="grid gap-x-6 py-3.5 border-b border-zinc-800/60 items-center hover:bg-zinc-800/30 transition-colors duration-150 -mx-2 px-2 rounded-lg"
                  style={{ gridTemplateColumns: "140px 1fr auto auto" }}>
                  <span className="text-zinc-600 text-xs">{t.date}</span>
                  <span className="text-zinc-200 text-xs truncate pr-4">{t.description}</span>
                  <div>
                    {editingId === t.id ? (
                      <select autoFocus value={t.category}
                        onChange={e => updateCat(t.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="bg-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1 outline-none border border-zinc-700">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => setEditingId(t.id)} className="flex items-center gap-1.5">
                        <span className="text-[11px] px-2.5 py-1 rounded-full"
                          style={{
                            background: `${CAT_COLORS[t.category] || "#71717a"}22`,
                            color: CAT_COLORS[t.category] || "#71717a",
                          }}>
                          {t.category}
                        </span>
                        {t.isAmbiguous && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/25 text-amber-500 uppercase tracking-wider">AI</span>
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-zinc-200 text-xs text-right">${t.amount.toFixed(2)}</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-zinc-700 text-xs text-center py-12">No transactions match your filter.</p>
              )}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(t => (
                <div key={t.id} className="bg-zinc-800/50 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-zinc-200 text-sm leading-tight max-w-[65%]">{t.description}</span>
                    <span className="text-zinc-100 text-sm">${t.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600 text-[11px]">{t.date}</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full"
                      style={{
                        background: `${CAT_COLORS[t.category] || "#71717a"}22`,
                        color: CAT_COLORS[t.category] || "#71717a",
                      }}>
                      {t.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Another */}
          <div className="mt-8 flex justify-center">
            <button onClick={() => setView("upload")}
              className="group flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-300 transition-colors duration-300">
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-300"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload new CSV
            </button>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-900 px-6 md:px-12 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="text-white text-sm uppercase tracking-[0.22em] mb-1">Ledger</p>
            <p className="text-zinc-700 text-[11px]">Personal finance, privately tracked.</p>
          </div>
          <div className="flex gap-8">
            {["Privacy", "GitHub", "Support"].map(l => (
              <button key={l} className="group relative text-zinc-600 text-[11px] uppercase tracking-widest hover:text-zinc-400 transition-colors duration-300">
                {l}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-zinc-500 group-hover:w-full transition-all duration-500 ease-out" />
              </button>
            ))}
          </div>
          <p className="text-zinc-800 text-[10px]">© 2026 Ledger</p>
        </div>
      </footer>
    </div>
  )
}
