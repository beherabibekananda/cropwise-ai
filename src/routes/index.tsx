import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Cpu,
  Filter,
  Globe2,
  Heart,
  Inbox,
  LayoutDashboard,
  Lock,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Console · Sentinel AI" },
      { name: "description", content: "Sentinel AI — real-time fraud detection console with ensemble anomaly scoring." },
    ],
  }),
  component: SentinelConsole,
});

// ---------- Mock data ----------

type Tx = {
  id: string;
  amount: number;
  ts: string;
  merchant: string;
  country: string;
  risk: number; // 0-100
};

const MERCHANTS = ["Stripe", "Adyen", "PayPal", "Square", "Wise", "Revolut", "Klarna", "Plaid"];
const COUNTRIES = ["US", "UK", "DE", "SG", "AE", "BR", "JP", "NG", "CA", "FR"];

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function makeTx(): Tx {
  const id = "TX-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const amount = Math.round((Math.random() ** 2) * 24000 + 12);
  const risk = Math.min(99, Math.max(2, Math.round((Math.random() ** 1.4) * 100)));
  return {
    id,
    amount,
    ts: new Date().toISOString(),
    merchant: rand(MERCHANTS),
    country: rand(COUNTRIES),
    risk,
  };
}

const SEED_TX: Tx[] = Array.from({ length: 14 }).map(makeTx).sort((a, b) => b.risk - a.risk);

// 24h hourly anomaly distribution
const RISK_SERIES = Array.from({ length: 24 }).map((_, i) => {
  const base = 18 + Math.sin(i / 3) * 10 + Math.random() * 14;
  const high = Math.max(2, Math.round(base * (0.4 + Math.random() * 0.4)));
  const med = Math.max(4, Math.round(base * (0.7 + Math.random() * 0.3)));
  const low = Math.round(base * (1.4 + Math.random() * 0.6));
  return {
    h: `${i.toString().padStart(2, "0")}:00`,
    low,
    med,
    high,
  };
});

// ---------- Page ----------

function SentinelConsole() {
  const [feed, setFeed] = useState<Tx[]>(SEED_TX);
  const [selected, setSelected] = useState<Tx>(SEED_TX[0]);
  const [pulse, setPulse] = useState(0);

  // live feed
  useEffect(() => {
    const t = setInterval(() => {
      const tx = makeTx();
      setFeed((prev) => [tx, ...prev].slice(0, 18));
      setPulse((p) => p + 1);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const total = feed.length;
    const flagged = feed.filter((t) => t.risk >= 70).length;
    const tps = (12 + Math.random() * 4).toFixed(1);
    return { total, flagged, tps };
  }, [feed, pulse]);

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-[1480px] px-4 lg:px-8 py-5 lg:py-7">
        <Topbar />
        <Hero stats={stats} />
        <div className="grid gap-5 mt-5 lg:grid-cols-3">
          <RiskChart />
          <ModelBreakdown tx={selected} />
        </div>
        <div className="grid gap-5 mt-5 lg:grid-cols-3">
          <div className="lg:col-span-2"><LiveFeed feed={feed} selectedId={selected.id} onSelect={setSelected} /></div>
          <AnomalyInsights tx={selected} />
        </div>
        <Footer />
      </div>
    </div>
  );
}

// ---------- Topbar ----------

function Topbar() {
  return (
    <header className="flex items-center gap-3">
      <div className="relative">
        <div className="size-10 rounded-xl grid place-items-center bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 ring-neon">
          <Shield className="size-5" style={{ color: "var(--neon)" }} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg lg:text-xl font-semibold tracking-tight">Sentinel AI</h1>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">v3.1 · ensemble</span>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">Fraud surveillance console — region: global</p>
      </div>
      <div className="hidden md:flex items-center gap-2 glass rounded-full px-3.5 py-2 w-72">
        <Search className="size-4 text-muted-foreground" />
        <input placeholder="Search TX-ID, merchant, country…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground" />
        <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </div>
      <button className="glass rounded-full size-10 grid place-items-center hover:scale-105 transition-transform relative">
        <Bell className="size-4" />
        <span className="absolute top-2 right-2 size-1.5 rounded-full" style={{ background: "var(--crimson)", boxShadow: "0 0 8px var(--crimson)" }} />
      </button>
      <button className="glass rounded-full size-10 grid place-items-center hover:scale-105 transition-transform">
        <Settings className="size-4" />
      </button>
      <div className="hidden sm:grid place-items-center size-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/30 text-xs font-semibold">SA</div>
    </header>
  );
}

// ---------- Hero stat strip ----------

function Hero({ stats }: { stats: { total: number; flagged: number; tps: string } }) {
  return (
    <section className="relative mt-5 overflow-hidden rounded-2xl border border-border glass-strong">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-1/3 animate-scan-x" style={{ background: "linear-gradient(90deg, transparent, var(--neon), transparent)" }} />
      </div>
      <div className="relative grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        <PulseStat icon={Activity} label="Live transactions / min" value={stats.tps} sub={`${stats.total} streaming`} accent="neon" />
        <PulseStat icon={ShieldAlert} label="Risk alerts" value={stats.flagged.toString()} sub="threshold ≥ 70" accent="crimson" />
        <PulseStat icon={Heart} label="System health" value="99.98%" sub="all nodes nominal" accent="emerald" />
      </div>
    </section>
  );
}

function PulseStat({
  icon: Icon, label, value, sub, accent,
}: { icon: any; label: string; value: string; sub: string; accent: "neon" | "crimson" | "emerald" }) {
  const color = accent === "neon" ? "var(--neon)" : accent === "crimson" ? "var(--crimson)" : "var(--emerald)";
  return (
    <div className="p-5 lg:p-6 flex items-center gap-4">
      <div className="relative">
        <div className="size-11 rounded-xl grid place-items-center border" style={{ background: `color-mix(in oklab, ${color} 12%, transparent)`, borderColor: `color-mix(in oklab, ${color} 35%, transparent)` }}>
          <Icon className="size-5" style={{ color }} />
        </div>
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full animate-pulse-dot" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
        <span className="absolute inset-0 rounded-xl animate-pulse-ring" style={{ boxShadow: `0 0 0 2px ${color}` }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-semibold font-mono tracking-tight">{value}</span>
          <span className="text-xs text-muted-foreground">{sub}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Risk distribution chart ----------

function RiskChart() {
  return (
    <div className="lg:col-span-2 glass-strong rounded-2xl p-5 lg:p-6 border border-border relative overflow-hidden">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--neon)", boxShadow: "0 0 10px var(--neon)" }} />
            <h2 className="text-sm font-semibold tracking-tight">Risk distribution · last 24h</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Anomaly scores aggregated by hour across all merchants.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <Legend dot="var(--emerald)" label="Low" />
          <Legend dot="var(--amber)" label="Medium" />
          <Legend dot="var(--crimson)" label="High" />
        </div>
      </div>
      <div className="h-[260px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={RISK_SERIES}>
            <defs>
              <linearGradient id="g-low" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.18 155)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="oklch(0.78 0.18 155)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-med" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.82 0.17 80)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="oklch(0.82 0.17 80)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-high" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.65 0.25 22)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="oklch(0.65 0.25 22)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
            <XAxis dataKey="h" tick={{ fill: "oklch(0.66 0.015 250)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.66 0.015 250)", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ background: "oklch(0.16 0.02 260)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12, fontSize: 12 }} cursor={{ stroke: "var(--neon)", strokeOpacity: 0.4 }} />
            <Area type="monotone" dataKey="low" stroke="oklch(0.78 0.18 155)" strokeWidth={1.5} fill="url(#g-low)" />
            <Area type="monotone" dataKey="med" stroke="oklch(0.82 0.17 80)" strokeWidth={1.5} fill="url(#g-med)" />
            <Area type="monotone" dataKey="high" stroke="oklch(0.65 0.25 22)" strokeWidth={2} fill="url(#g-high)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border">
      <span className="size-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} />
      {label}
    </span>
  );
}

// ---------- Model breakdown card ----------

function ModelBreakdown({ tx }: { tx: Tx }) {
  // Derive per-model scores around the ensemble risk
  const seed = parseInt(tx.id.replace(/[^0-9]/g, "") || "1", 10) || 1;
  const jitter = (n: number) => Math.max(2, Math.min(99, Math.round(tx.risk + ((seed * n) % 23) - 11)));
  const models = [
    { name: "Isolation Forest", short: "IFOR", score: jitter(7), icon: Filter },
    { name: "Autoencoder", short: "AE", score: jitter(13), icon: Cpu },
    { name: "COPOD", short: "COPOD", score: jitter(19), icon: Sparkles },
  ];
  const verdict = tx.risk >= 70 ? "FLAGGED" : tx.risk >= 40 ? "REVIEW" : "CLEAR";
  const verdictColor = tx.risk >= 70 ? "var(--crimson)" : tx.risk >= 40 ? "var(--amber)" : "var(--emerald)";
  return (
    <div className="glass-strong rounded-2xl p-5 lg:p-6 border border-border relative overflow-hidden">
      <div className="absolute -top-12 -right-12 size-40 rounded-full blur-3xl" style={{ background: `color-mix(in oklab, ${verdictColor} 35%, transparent)` }} />
      <div className="relative flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Ensemble verdict</p>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-base font-semibold font-mono">{tx.id}</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border" style={{ color: verdictColor, borderColor: `color-mix(in oklab, ${verdictColor} 50%, transparent)`, background: `color-mix(in oklab, ${verdictColor} 12%, transparent)` }}>{verdict}</span>
          </div>
        </div>
        <Gauge score={tx.risk} size={68} accent={verdictColor} primary />
      </div>
      <div className="grid grid-cols-3 gap-3 relative">
        {models.map((m) => (
          <div key={m.short} className="rounded-xl border border-border bg-card/40 p-3 flex flex-col items-center text-center">
            <Gauge score={m.score} size={56} accent="var(--neon)" />
            <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">{m.short}</p>
            <p className="text-[11px] font-medium leading-tight">{m.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Gauge({ score, size = 60, accent = "var(--neon)", primary = false }: { score: number; size?: number; accent?: string; primary?: boolean }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(1 0 0 / 8%)" strokeWidth={primary ? 6 : 5} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={accent} strokeWidth={primary ? 6 : 5} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className={primary ? "text-base font-mono font-semibold" : "text-xs font-mono font-semibold"} style={{ color: accent }}>{score}</span>
      </div>
    </div>
  );
}

// ---------- Live feed table ----------

function LiveFeed({ feed, selectedId, onSelect }: { feed: Tx[]; selectedId: string; onSelect: (t: Tx) => void }) {
  return (
    <div className="glass-strong rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-5 lg:p-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--emerald)", boxShadow: "0 0 10px var(--emerald)" }} />
            <h2 className="text-sm font-semibold tracking-tight">Live transaction feed</h2>
            <span className="text-[10px] font-mono text-muted-foreground">streaming</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Click a row to inspect ensemble breakdown.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border"><Wifi className="size-3" />WSS</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border"><Lock className="size-3" />E2E</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left font-medium px-5 py-2.5">TX ID</th>
              <th className="text-left font-medium px-3 py-2.5">Merchant</th>
              <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell">Geo</th>
              <th className="text-right font-medium px-3 py-2.5">Amount</th>
              <th className="text-left font-medium px-3 py-2.5 hidden sm:table-cell">Time</th>
              <th className="text-left font-medium px-3 py-2.5 w-[34%]">Risk score</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {feed.map((t) => (
                <motion.tr
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -6, background: "color-mix(in oklab, var(--neon) 10%, transparent)" }}
                  animate={{ opacity: 1, y: 0, background: "transparent" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => onSelect(t)}
                  className={`cursor-pointer border-b border-border/60 hover:bg-white/[0.03] transition-colors ${selectedId === t.id ? "bg-white/[0.04]" : ""}`}
                >
                  <td className="px-5 py-3 font-mono text-xs">{t.id}</td>
                  <td className="px-3 py-3 text-xs">{t.merchant}</td>
                  <td className="px-3 py-3 text-xs hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Globe2 className="size-3" />{t.country}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs">${t.amount.toLocaleString()}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground hidden sm:table-cell font-mono">{new Date(t.ts).toLocaleTimeString()}</td>
                  <td className="px-3 py-3"><RiskBar score={t.risk} /></td>
                  <td className="px-5 py-3 text-right">
                    {t.risk >= 70 ? <ShieldAlert className="size-4 inline" style={{ color: "var(--crimson)" }} /> : t.risk >= 40 ? <AlertTriangle className="size-4 inline" style={{ color: "var(--amber)" }} /> : <ShieldCheck className="size-4 inline" style={{ color: "var(--emerald)" }} />}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? "var(--crimson)" : score >= 40 ? "var(--amber)" : "var(--emerald)";
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, var(--emerald), var(--amber), var(--crimson))`, boxShadow: `0 0 10px ${color}` }}
        />
      </div>
      <span className="font-mono text-[11px] w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

// ---------- Anomaly insights ----------

function AnomalyInsights({ tx }: { tx: Tx }) {
  const flags = [
    { ok: tx.risk < 70, label: "Velocity within baseline" },
    { ok: tx.country !== "NG" && tx.country !== "BR", label: "Geo not on watchlist" },
    { ok: tx.amount < 8000, label: "Amount within typical range" },
    { ok: Math.random() > 0.4, label: "Device fingerprint trusted" },
  ];
  return (
    <div className="glass-strong rounded-2xl p-5 lg:p-6 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <Inbox className="size-4" style={{ color: "var(--neon)" }} />
          Anomaly insights
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">{tx.id}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Cross-feature signals contributing to the ensemble verdict.</p>
      <ul className="space-y-2">
        {flags.map((f, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-lg border border-border bg-card/40">
            <span>{f.label}</span>
            <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full`} style={{ color: f.ok ? "var(--emerald)" : "var(--crimson)", background: `color-mix(in oklab, ${f.ok ? "var(--emerald)" : "var(--crimson)"} 12%, transparent)` }}>
              {f.ok ? "PASS" : "FAIL"}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex gap-2">
        <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-medium px-3 py-2.5 ring-crimson hover:opacity-90 transition" style={{ background: "color-mix(in oklab, var(--crimson) 18%, transparent)", color: "var(--crimson)" }}>
          <ShieldAlert className="size-3.5" /> Block
        </button>
        <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-medium px-3 py-2.5 ring-neon hover:opacity-90 transition" style={{ background: "color-mix(in oklab, var(--neon) 14%, transparent)", color: "var(--neon)" }}>
          <Zap className="size-3.5" /> Investigate
        </button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--emerald)" }} />api.sentinel.ai · 12ms</span>
        <span className="hidden sm:inline">cluster: us-east-1</span>
      </div>
      <span>© Sentinel AI · all telemetry encrypted</span>
    </footer>
  );
}
