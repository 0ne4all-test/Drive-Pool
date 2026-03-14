"use client";

import Link from "next/link";
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

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + " MB";
  return (bytes / 1e3).toFixed(0) + " KB";
}

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
};

function StatCard({ label, value, sub, icon, iconBg }: StatCardProps) {
  return (
    <div className="rounded-xl border border-dp-border bg-dp-s1 p-5">
      <div className={`mb-4 inline-flex rounded-lg p-2.5 ${iconBg}`}>{icon}</div>
      <div className="text-2xl font-semibold text-dp-text">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-dp-text3">{sub}</div>}
      <div className="mt-1 text-sm text-dp-text2">{label}</div>
    </div>
  );
}

function StorageCard({ used, free, iconBg }: { used: string; free: string; iconBg: string }) {
  return (
    <div className="rounded-xl border border-dp-border bg-dp-s1 p-5">
      <div className={`mb-4 inline-flex rounded-lg p-2.5 ${iconBg}`}>
        <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-semibold text-dp-text">{used}</div>
          <div className="mt-0.5 text-xs text-dp-text3">used</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-emerald-400">{free}</div>
          <div className="mt-0.5 text-xs text-dp-text3">free</div>
        </div>
      </div>
      <div className="mt-2 text-sm text-dp-text2">Storage</div>
    </div>
  );
}

function FileTypeIcon({ mimeType }: { mimeType: string | null }) {
  const t = mimeType ?? "";
  let bg = "bg-dp-hover";
  let text = "text-dp-text2";
  let label = "FILE";

  if (t === "application/vnd.google-apps.folder") { bg = "bg-yellow-500/10"; text = "text-yellow-400"; label = "DIR"; }
  else if (t.startsWith("image/")) { bg = "bg-purple-500/10"; text = "text-purple-400"; label = "IMG"; }
  else if (t.startsWith("video/")) { bg = "bg-blue-500/10"; text = "text-blue-400"; label = "VID"; }
  else if (t.startsWith("audio/")) { bg = "bg-pink-500/10"; text = "text-pink-400"; label = "AUD"; }
  else if (t.includes("pdf")) { bg = "bg-red-500/10"; text = "text-red-400"; label = "PDF"; }
  else if (t.includes("spreadsheet") || t.includes("sheet")) { bg = "bg-emerald-500/10"; text = "text-emerald-400"; label = "XLS"; }
  else if (t.includes("presentation") || t.includes("slide")) { bg = "bg-orange-500/10"; text = "text-orange-400"; label = "PPT"; }
  else if (t.includes("document") || t.startsWith("text/")) { bg = "bg-sky-500/10"; text = "text-sky-400"; label = "DOC"; }

  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-md text-[9px] font-bold ${bg} ${text}`}>
      {label}
    </div>
  );
}

export default function OverviewPage() {
  const { accounts } = useStorage();
  const { files } = useFiles();
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

  const s = stats;
  const connectedAccounts = accounts.filter((a) => a.is_connected);
  const totalUsed = connectedAccounts.reduce((acc, a) => acc + a.used, 0);
  const totalLimit = connectedAccounts.reduce((acc, a) => acc + a.limit, 0);
  const totalFree = Math.max(0, totalLimit - totalUsed);
  const connectedCount = connectedAccounts.length;
  const recentFiles = files.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-dp-text">Overview</h1>
          <p className="mt-1 text-sm text-dp-text2">Your unified cloud storage at a glance</p>
        </div>
        {fromCache && (
          <Link
            href="/dashboard/stats"
            className="flex items-center gap-1.5 rounded-full border border-dp-border bg-dp-s1 px-3 py-1 text-xs text-dp-text2 transition hover:text-orange-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            Cached · View analytics
          </Link>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Files"
          value={(s?.totalFiles ?? 0).toString()}
          sub={`${s?.totalFolders ?? 0} folders`}
          iconBg="bg-orange-500/10"
          icon={
            <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          }
        />
        <StorageCard
          used={formatBytes(totalUsed)}
          free={formatBytes(totalFree)}
          iconBg="bg-blue-500/10"
        />
        <StatCard
          label="Total Storage"
          value={formatBytes(totalLimit)}
          sub={`${connectedCount} account${connectedCount !== 1 ? "s" : ""} · ${((totalUsed / (totalLimit || 1)) * 100).toFixed(1)}% used`}
          iconBg="bg-violet-500/10"
          icon={
            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          }
        />
        <StatCard
          label="Drive Accounts"
          value={`${connectedCount} / ${accounts.length}`}
          sub={accounts.length - connectedCount > 0 ? `${accounts.length - connectedCount} disconnected` : "All connected"}
          iconBg="bg-orange-500/10"
          icon={
            <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
      </div>

      {/* Storage breakdown + File types */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-dp-border bg-dp-s1 p-5">
          <h2 className="mb-4 text-sm font-medium text-dp-text">Storage Breakdown</h2>
          <div className="mb-5">
            <div className="mb-1.5 flex items-end justify-between">
              <span className="text-lg font-semibold text-dp-text">{formatBytes(totalUsed)}</span>
              <span className="text-xs text-dp-text3">of {formatBytes(totalLimit)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-dp-hover">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-700"
                style={{ width: `${totalLimit > 0 ? Math.min(100, (totalUsed / totalLimit) * 100) : 0}%` }}
              />
            </div>
          </div>
          <div className="space-y-3">
            {connectedAccounts.map((a) => {
              const pct = a.limit > 0 ? Math.min(100, (a.used / a.limit) * 100) : 0;
              return (
                <div key={a.account_index}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="max-w-[200px] truncate text-dp-text2">
                      {a.email ?? `Account ${a.account_index}`}
                    </span>
                    <span className="text-dp-text3">{formatBytes(a.used)} / {formatBytes(a.limit)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-dp-hover">
                    <div className="h-full rounded-full bg-orange-500/60 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {connectedCount === 0 && <p className="text-sm text-dp-text3">No connected accounts</p>}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-dp-border bg-dp-s1 p-5">
          <h2 className="mb-4 text-sm font-medium text-dp-text">File Types</h2>
          <div className="space-y-2.5">
            {[
              { key: "Images", color: "bg-purple-500", textColor: "text-purple-400" },
              { key: "Documents", color: "bg-sky-500", textColor: "text-sky-400" },
              { key: "Videos", color: "bg-blue-500", textColor: "text-blue-400" },
              { key: "Folders", color: "bg-yellow-500", textColor: "text-yellow-400" },
              { key: "PDFs", color: "bg-red-500", textColor: "text-red-400" },
              { key: "Spreadsheets", color: "bg-emerald-500", textColor: "text-emerald-400" },
              { key: "Other", color: "bg-dp-text3", textColor: "text-dp-text2" },
            ]
              .filter(({ key }) => (s?.filesByType[key] ?? 0) > 0)
              .map(({ key, color, textColor }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    <span className="text-sm text-dp-text2">{key}</span>
                  </div>
                  <span className={`text-sm font-medium ${textColor}`}>{s?.filesByType[key] ?? 0}</span>
                </div>
              ))}
            {!s && <p className="text-sm text-dp-text3">Loading…</p>}
            {s && Object.keys(s.filesByType).length === 0 && (
              <p className="text-sm text-dp-text3">No files yet</p>
            )}
          </div>
          <div className="mt-4 border-t border-dp-border pt-4">
            <Link href="/dashboard/stats" className="text-xs text-orange-400 hover:underline">
              View detailed analytics →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent files */}
      <div className="rounded-xl border border-dp-border bg-dp-s1">
        <div className="flex items-center justify-between border-b border-dp-border px-5 py-4">
          <h2 className="text-sm font-medium text-dp-text">Recent Files</h2>
          <Link href="/dashboard/files" className="text-xs text-dp-text2 transition hover:text-orange-400">
            View all →
          </Link>
        </div>
        {recentFiles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-dp-text3">No files yet. Upload something to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-dp-border">
            {recentFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-4 px-5 py-3 transition hover:bg-dp-hover">
                <div className="flex-shrink-0">
                  {file.has_thumbnail ? (
                    <img
                      src={`/api/files/${file.id}/thumbnail`}
                      alt=""
                      className="h-8 w-8 rounded-md object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <FileTypeIcon mimeType={file.mime_type} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-dp-text">{file.file_name}</p>
                  <p className="text-xs text-dp-text3">
                    {formatBytes(file.size)} · Account #{file.account_index}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-dp-text3">
                  {new Date(file.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
