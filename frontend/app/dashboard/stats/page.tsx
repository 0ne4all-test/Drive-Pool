"use client";

import { useEffect, useState } from "react";
import { useFiles } from "@/hooks/useFiles";
import { useStorage } from "@/hooks/useStorage";
import {
  type CachedStats,
  computeStats,
  getCachedStats,
  isStatsDirty,
  setCachedStats,
} from "@/hooks/useStats";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + " MB";
  return (bytes / 1e3).toFixed(0) + " KB";
}

const TYPE_COLORS: Record<string, string> = {
  Images: "#fb923c",
  Videos: "#60a5fa",
  Audio: "#f472b6",
  PDFs: "#f87171",
  Documents: "#38bdf8",
  Spreadsheets: "#34d399",
  Presentations: "#fbbf24",
  Folders: "#fcd34d",
  Archives: "#fb923c",
  Other: "#6b7280",
};

const ACCOUNT_COLORS = ["#f97316", "#f97316", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const TOOLTIP_WRAPPER: React.CSSProperties = {
  background: "none",
  border: "none",
  boxShadow: "none",
  padding: 0,
  outline: "none",
};

function CustomTooltip({ active, payload, label, formatter }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  formatter?: (val: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-dp-border bg-dp-s1 px-3 py-2 shadow-xl text-xs">
      {label && <p className="mb-1 font-medium text-dp-text">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-dp-text2">{p.name}:</span>
          <span className="font-medium text-dp-text">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const { files } = useFiles();
  const { accounts } = useStorage();
  const [stats, setStats] = useState<CachedStats | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (files.length === 0 && accounts.length === 0) return;
    if (isStatsDirty()) {
      const fresh = computeStats(files, accounts);
      setCachedStats(fresh);
      setStats(fresh);
      setFromCache(false);
    } else {
      const cached = getCachedStats();
      if (cached) {
        setStats(cached);
        setFromCache(true);
      } else {
        const fresh = computeStats(files, accounts);
        setCachedStats(fresh);
        setStats(fresh);
        setFromCache(false);
      }
    }
  }, [files, accounts]);

  function forceRefresh() {
    const fresh = computeStats(files, accounts);
    setCachedStats(fresh);
    setStats(fresh);
    setFromCache(false);
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-dp-border border-t-orange-500" />
          <p className="text-sm text-dp-text2">Loading statistics…</p>
        </div>
      </div>
    );
  }

  const pieData = Object.entries(stats.filesByType)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const connectedAccounts = accounts.filter((a) => a.is_connected);
  const storageData = connectedAccounts.map((a) => ({
    name: a.email ? a.email.split("@")[0] : `Acct ${a.account_index}`,
    used: a.used,
    free: a.free,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-dp-text">Analytics</h1>
          <p className="mt-1 text-sm text-dp-text2">
            Storage usage and upload trends
            {fromCache && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-dp-border px-2 py-0.5 text-xs text-dp-text3">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                Cached
              </span>
            )}
          </p>
        </div>
        <button
          onClick={forceRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-dp-border bg-dp-s1 px-3 py-2 text-xs text-dp-text2 transition hover:border-orange-500/30 hover:text-orange-400"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Files", value: stats.totalFiles.toString(), color: "text-orange-400" },
          { label: "Total Folders", value: stats.totalFolders.toString(), color: "text-yellow-400" },
          { label: "Total Size", value: formatBytes(stats.totalSize), color: "text-blue-400" },
          { label: "Accounts", value: connectedAccounts.length.toString(), color: "text-emerald-400" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-dp-border bg-dp-s1 px-4 py-3">
            <p className={`text-xl font-semibold ${item.color}`}>{item.value}</p>
            <p className="mt-0.5 text-xs text-dp-text2">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly uploads */}
      <div className="rounded-xl border border-dp-border bg-dp-s1 p-5">
        <h2 className="mb-5 text-sm font-medium text-dp-text">Weekly Upload Activity</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stats.weeklyUploads} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--dp-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--dp-text3)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--dp-text3)" }} allowDecimals={false} />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={TOOLTIP_WRAPPER}
            />
            <Area type="monotone" dataKey="count" name="Uploads" stroke="#f97316" strokeWidth={2} fill="url(#uploadGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Storage + pie */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-dp-border bg-dp-s1 p-5">
          <h2 className="mb-5 text-sm font-medium text-dp-text">Storage by Account</h2>
          {storageData.length === 0 ? (
            <p className="py-8 text-center text-sm text-dp-text3">No connected accounts</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={storageData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dp-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--dp-text3)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--dp-text3)" }} tickFormatter={(v) => formatBytes(v)} />
                <Tooltip
                  content={<CustomTooltip formatter={formatBytes} />}
                  wrapperStyle={TOOLTIP_WRAPPER}
                />
                <Bar dataKey="used" name="Used" stackId="a" radius={[0, 0, 4, 4]}>
                  {storageData.map((_, i) => (
                    <Cell key={i} fill={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]} />
                  ))}
                </Bar>
                <Bar dataKey="free" name="Free" stackId="a" fill="var(--dp-hover)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-dp-border bg-dp-s1 p-5">
          <h2 className="mb-5 text-sm font-medium text-dp-text">Files by Type</h2>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-sm text-dp-text3">No files yet</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={TYPE_COLORS[entry.name] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} wrapperStyle={TOOLTIP_WRAPPER} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: TYPE_COLORS[entry.name] ?? "#6b7280" }} />
                      <span className="truncate text-xs text-dp-text2">{entry.name}</span>
                    </div>
                    <span className="flex-shrink-0 text-xs font-medium text-dp-text">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Size by type */}
      {Object.keys(stats.sizeByType).length > 0 && (
        <div className="rounded-xl border border-dp-border bg-dp-s1 p-5">
          <h2 className="mb-5 text-sm font-medium text-dp-text">Storage by File Type</h2>
          <div className="space-y-3">
            {Object.entries(stats.sizeByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, size]) => {
                const pct = stats.totalSize > 0 ? (size / stats.totalSize) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-dp-text2">{type}</span>
                      <span className="text-dp-text3">{formatBytes(size)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-dp-hover">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: TYPE_COLORS[type] ?? "#6b7280" }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
